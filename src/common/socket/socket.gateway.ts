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
import { LoginRequest, SocketResponse, SocketResponseBody } from "../type/socket.type";
import { ERROR, FailedResponse } from "../type/response.type";
import { AuthService } from "src/services/auth.service";

import * as dotenv from "dotenv"
import { MerchantRepository } from "src/repositories/store/merchant.repository";
import { SocketEventHandler } from "./event.handler";
import { RedisService } from "src/services/redis.service";
import { StoreWalletEntity } from "src/repositories/store/storewallet.entity";
import { OrderEntity } from "src/repositories/user/order.entity";
import { StoreRepository } from "src/repositories/store/store.repository";

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
    ){}

    @WebSocketServer() private readonly server: Server;

    @SubscribeMessage('ping')
    async pingPong(
    ) {
        return { message: 'pong' }
    }

    @SubscribeMessage('accept-order')
    async handleAccpetOrder(
        @MessageBody() data: string
    ) : Promise<SocketResponse<
    any,
    | typeof ERROR.ServerDatabaseError
    | typeof ERROR.NotFoundData>> {
        try {
            await this.redis.set(data, "accept", SocketGateWay.name)
            .catch(err => {
                Logger.error("주문 승인중 오류가 발생했습니다.", SocketGateWay.name)
                throw err
            })
            
            return {
                result: true,
                message: "accept",
            }
        } catch(e) {
            return {
                result: false,
                message: "fail",
                data: e,
            }
        }
    }

    @SubscribeMessage('refuse-order')
    async handleRefuseOrder(
        @MessageBody() data: OrderEntity
    ) : Promise<SocketResponse<
    any, 
    | typeof ERROR.ServerDatabaseError
    | typeof ERROR.NotFoundData
    >> {
        try {
            const result : boolean 
            = !!(await this.storeRepository.deleteOrder(data.uuid)
            .then(async res => {
                await this.redis.set(data.uuid, "refuse", SocketGateWay.name)
                return res
            })
            .catch(err => {
                Logger.error("주문 삭제중 오류가 발생했습니다.", SocketGateWay.name)
                throw err
            }))
            return {
                result,
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

    sendOrder(socketId: string, order: OrderEntity)
    : boolean {
        return this.server
        .timeout(1000)
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