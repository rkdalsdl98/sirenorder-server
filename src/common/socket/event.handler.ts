import { Socket } from "socket.io";
import { RoomJoinOptions, RoomleaveOptions } from "../type/socket.type";
import { RedisService } from "src/services/redis.service";
import { AuthService } from "src/services/auth.service";
import { MerchantEntity } from "src/repositories/store/merchant.entity";
import { ERROR, TryCatch } from "../type/response.type";
import { StoreWalletEntity } from "src/repositories/store/storewallet.entity";

const logPath = "SocketEventHandler"

export namespace SocketEventHandler {
    export namespace Connection {
        export const connect = async (
            client: Socket, 
            options: RoomJoinOptions, 
            redis: RedisService
        ) => {
            if(client.rooms.has(options.gu)) return
            const caches = await redis.get<RoomJoinOptions[]>(options.gu, logPath)
            await redis.set(options.gu,
                caches 
                ? [...caches, options] 
                : [options],
                logPath
            )
            client.join(options.gu)
        }
        export const disconnect = async (
            client: Socket, 
            error: any,
            redis?: RedisService,
            options?: RoomleaveOptions, 
        ) => {
            if(options && redis) {
                await leaveroom(client, options, redis)
                client.emit("error", error)
            }
            client.disconnect()
        }
        export const leaveroom = async (
            client: Socket, 
            options: RoomleaveOptions,
            redis: RedisService,
        ) => {
            if(!client.rooms.has(options.gu)) return
            const caches = await redis.get<{ storename: string }[]>(options.gu, logPath)
            let after : { storename: string }[] = []

            if(caches) caches.forEach(c => {
                if(c.storename !== options.storename) after.push(c)
            })
            
            await redis.set(options.gu,
                after,
                logPath
            )
            client.leave(options.gu)
        }
    }

    export namespace MessageHandler {
        export const login = (
            findMerchant: MerchantEntity,
            pass: string, 
            auth: AuthService
        ) : StoreWalletEntity => {
            const isVerfify = auth.verifyPass({ pass }, findMerchant.salt, findMerchant.pass)
            if(isVerfify) {
                return findMerchant.store.wallet!
            }
            var error = ERROR.UnAuthorized
            error.substatus = "NotEqualPass"
            throw error
        }
    }
}