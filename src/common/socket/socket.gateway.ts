import { Logger } from "@nestjs/common";
import { 
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

dotenv.config()
const port : number = parseInt(process.env.SOCKET_PORT ?? "3001")

@WebSocketGateway(port, {
    namespace: "MerchantGateWay",
    cors: "*",
})
export class SocketGateWay 
implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    constructor(
        private readonly merchantRepository: MerchantRepository,
        private readonly auth: AuthService,
        private readonly redis: RedisService,
    ){}

    @WebSocketServer() server: Server;
    
    /**
     * 로그인 정보를 확인하고 일치한다면 상점 지갑정보를 리턴
     * 
     * 일치하지 않다면 요청한 클라이언트로 에러메세지 emit 후 연결종료
     * @param client 
     * @param data 
     * @returns StoreWallet | void
     */
    @SubscribeMessage('connect')
    async handleEvent(
        client: Socket, 
        @MessageBody() data: LoginRequest
    ) : Promise<SocketResponse<
    StoreWalletEntity, 
    | typeof ERROR.UnAuthorized
    | typeof ERROR.ServerDatabaseError
    | typeof ERROR.ServerCacheError
    >> {
        try {
            const merchant = await this.merchantRepository.getBy({ uuid: data.merchantId })
            const loginResult = 
            SocketEventHandler
            .MessageHandler
            .login(merchant, data.pass, this.auth)
    
            await SocketEventHandler
            .Connection
            .connect(client, { 
                gu: data.gu, 
                storename: merchant.store.storename,
                thumbnail: merchant.store.thumbnail,
                location: merchant.store.location,
                address: merchant.store.address,
                detail: merchant.store.detail,
            }, this.redis)
            return {
                result: true,
                message: "Done!",
                data: loginResult,
            }
        } catch(e) {
            await SocketEventHandler
            .Connection
            .disconnect(client, e)
        }
    }
    
    afterInit(_) {
        Logger.log("상점 게이트웨이 초기화 ✅", SocketGateWay.name)
    }

    handleDisconnect(client: Socket) {
        Logger.log(`정상적인 연결종료 ✅ : ${client.id}`, SocketGateWay.name)
    }

    handleConnection(client: Socket, ...args: any[]) {
        Logger.log(`정상적인 연결 ✅ : ${client.id}`, SocketGateWay.name)
    }
}