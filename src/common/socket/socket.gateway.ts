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
import { StoreDto } from "src/dto/store.dto";
import { RedisService } from "src/services/redis.service";

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

    @SubscribeMessage('connect')
    async handleEvent(
        client: Socket, 
        @MessageBody() data: LoginRequest
    ): Promise<SocketResponse<
    unknown,
    | typeof ERROR.ServerDatabaseError
    >> {
        let error
        let body

        this.merchantRepository.getBy({ uuid: data.merchantId })
        .then(merchant => {
            if(merchant) {
                const isVerify = this.auth.verifyPass({ pass: data.merchantId }, merchant.salt, merchant.pass)
                if(isVerify) {
                    error = ERROR.UnAuthorized
                    error.substatus = "NotEqualPass"
                } else {
                    body = { ...merchant.store } as StoreDto
                }
            }
        })
        .catch(err => {
            Logger.error("존재하지 않는 상인정보", err, SocketGateWay.name)
            error = err
        })
        
        if(error !== undefined) {
            await SocketEventHandler
            .Connection
            .disconnect(client, { gu: data.gu, storename: body.storename }, this.redis)
            return {
                result: false,
                message: error.message,
                data: error,
            }
        }

        await SocketEventHandler
        .Connection
        .connect(client, { gu: data.gu, ...body }, this.redis )
        return {
            result: true,
            message: "Done!",
            data: body,
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