import { Logger } from "@nestjs/common";
import { 
    ConnectedSocket,
    MessageBody, 
    OnGatewayConnection, 
    OnGatewayDisconnect, 
    OnGatewayInit, 
    SubscribeMessage, 
    WebSocketGateway, 
    WebSocketServer, 
} from "@nestjs/websockets"
import { Server, Socket } from "socket.io";
import { LoginRequest, SocketResponse } from "../type/socket.type";
import { ERROR } from "../type/response.type";
import { AuthService } from "src/services/auth.service";

import * as dotenv from "dotenv"
import { MerchantRepository } from "src/repositories/store/merchant.repository";
import { SocketEventHandler } from "./event.handler";
import { RedisService } from "src/services/redis.service";
import { StoreWalletEntity } from "src/repositories/store/storewallet.entity";
import { OrderEntity } from "src/repositories/user/order.entity";
import { StoreRepository } from "src/repositories/store/store.repository";
import { PortOneMethod } from "../methods/portone.method";
import { OrderState, RefuseOrder } from "../type/order.type";
import { SSEService } from "src/services/sse.service";
import { GiftNotifySubject, OrderNotifySubject } from "../type/sse.type";
import { GiftEntity } from "src/repositories/user/gift.entity";

dotenv.config()
const port : number = parseInt(process.env.SOCKET_PORT ?? "3001")

@WebSocketGateway(port, {
    namespace: "merchantgateWay",
    cors: "*",
})
export class SocketGateWay 
implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    constructor(
        private readonly merchantRepository: MerchantRepository,
        private readonly storeRepository: StoreRepository,
        private readonly auth: AuthService,
        private readonly redis: RedisService,
        private readonly sseService: SSEService,
    ){}

    @WebSocketServer() private readonly server: Server;

    @SubscribeMessage('ping')
    async pingPong(
    ) {
        return { message: 'pong' }
    }

    @SubscribeMessage('finish-order')
    async handleFinishOrder(
        @MessageBody() data: string
    ) : Promise<SocketResponse<
    any,
    | typeof ERROR.ServerDatabaseError
    | typeof ERROR.ServerCacheError
    | typeof ERROR.NotFoundData>> {
        try {
            const buyer_email = await PortOneMethod.finishOrder({
                order_uid: data,
                redis: this.redis,
                repository: this.storeRepository,
            })
            this.pushStateMessage(buyer_email, "finish")
            return {
                result: true,
                message:"finish",
            }
        } catch(e) {
            await PortOneMethod.removeOrderById({
                redis: this.redis,
                order_uid: data,
            })
            await this.storeRepository.deleteOrder(data)
            return {
                result: false,
                message: "fail",
                data: e,
            }
        }
    }


    @SubscribeMessage('accept-order')
    async handleAccpetOrder(
        @MessageBody() data: string
    ) : Promise<SocketResponse<
    any,
    | typeof ERROR.ServerDatabaseError
    | typeof ERROR.ServerCacheError
    | typeof ERROR.NotFoundData>> {
        try {
            const buyer_email = await PortOneMethod.acceptOrder({
                order_uid: data,
                redis: this.redis,
                repository: this.storeRepository,
            })
            this.pushStateMessage(buyer_email, "accept")
            return {
                result: true,
                message: "accept",
            }
        } catch(e) {
            await PortOneMethod.removeOrderById({
                redis: this.redis,
                order_uid: data,
            })
            return {
                result: false,
                message: "fail",
                data: e,
            }
        }
    }

    @SubscribeMessage('refuse-order')
    async handleRefuseOrder(
        @MessageBody() data: RefuseOrder
    ) : Promise<SocketResponse<
    any, 
    | typeof ERROR.ServerDatabaseError
    | typeof ERROR.ServerCacheError
    | typeof ERROR.NotFoundData
    >> {
        try {
            // const result : boolean = await PortOneMethod.refuseOrder({
            //     reason: data.reason,
            //     imp_uid: data.imp_uid,
            //     redis: this.redis
            // })
            const buyer_email = await PortOneMethod.removeOrderById({
                redis: this.redis,
                order_uid: data.uuid,
            })
            this.pushStateMessage(buyer_email, "refuse")
            return {
                result: true,
                message: "refuse",
            }
        } catch(e) {
            return {
                result: false,
                message: "fail",
                data: e,
            }
        }
    }

    /**
     * 로그인 정보를 확인하고 일치한다면 상점 지갑정보를 리턴
     * 
     * 일치하지 않다면 요청한 클라이언트로 에러메세지 emit 후 연결종료
     * @param data 
     * @returns StoreWallet | void
     */
    @SubscribeMessage('login')
    async handleConnectEvent(
        @ConnectedSocket() client: Socket, 
        @MessageBody() data: LoginRequest
    ) : Promise<SocketResponse<
    StoreWalletEntity, 
    | typeof ERROR.UnAuthorized
    | typeof ERROR.ServerDatabaseError
    | typeof ERROR.ServerCacheError
    >> {
        let storeId: string = ""
        try {
            const merchant = await this.merchantRepository.getBy({ uuid: data.merchantId })
            storeId = merchant.store.uuid

            const loginResult = 
            SocketEventHandler
            .MessageHandler
            .login(merchant, data.pass, this.auth)

            await SocketEventHandler
            .Connection
            .connect(storeId, client.id, this.redis)
            return {
                result: true,
                message: "connect",
                data: loginResult,
            }
        } catch(e) {
            await SocketEventHandler
            .Connection
            .disconnect({
                client,
                redis: this.redis,
                error: e,
            })
        }
    }

    pushStateMessage(
        buyer_email: string, 
        order_state: OrderState,
    ) {
        this.sseService.pushMessage({
            notify_type: "order-notify",
            subject: {
                order_state,
                receiver_email: buyer_email,
            } as OrderNotifySubject
        })
    }

    pushGiftMessage(gift: GiftEntity) {
        this.sseService.pushMessage({
            notify_type: "gift-notify",
            subject: {
                gift
            } as GiftNotifySubject
        })
    }

    sendOrder(socketId: string, order: OrderEntity)
    : boolean {
        return this.server
        .timeout(300)
        .to(socketId)
        .emit(
            "order", 
            { result: true, message: "done", data: order }
        )
    }
    
    afterInit(_) {
        Logger.log(`상점 소켓 게이트웨이 초기화 ✅ : 대기 포트 => ${port}`, SocketGateWay.name)
    }

    handleDisconnect(client: Socket) {
        SocketEventHandler
        .Connection
        .disconnect({ client, redis: this.redis})
        .then(_=> {
            Logger.log(`정상적인 연결종료 ✅ : ${client.id}`, SocketGateWay.name)
        })
        .catch(err => {
            Logger.error("연결해제중 오류발생", err)
        })
    }

    handleConnection(client: Socket, ...args: any[]) {
        Logger.log(`정상적인 연결 ✅ : ${client.id}`, SocketGateWay.name)
    }
}