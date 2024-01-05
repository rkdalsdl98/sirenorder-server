import { Socket } from "socket.io";
import { StoreCache, SocketResponseBody } from "../type/socket.type";
import { RedisService } from "src/services/redis.service";
import { AuthService } from "src/services/auth.service";
import { MerchantEntity } from "src/repositories/store/merchant.entity";
import { ERROR, FailedResponse } from "../type/response.type";
import { StoreWalletEntity } from "src/repositories/store/storewallet.entity";

const logPath = "SocketEventHandler"

export namespace SocketEventHandler {
    export namespace Connection {
        export const connect = async ( 
            storeId: string,
            socketId: string, 
            redis: RedisService
        ) => {
            const caches = await redis.get<StoreCache[]>("stores", logPath)
            const store = caches!.find(s => s.storeId === storeId)
            
            if(!store) {
                throw ERROR.NotFoundData
            } else {
                const after = caches?.map(c => {
                    if(c.storeId === storeId) return { 
                        ...store, 
                        isOpen: true, 
                        socketId,
                    }
                    return c
                })
                redis.set("stores", 
                    after ?? [{ ...store, isOpen: true, socketId }],
                    logPath
                )
            }
        }
        export const disconnect = async (options: {
            client: Socket,
            error?: any,
            redis?: RedisService,
        }) => {
            if(options.redis) {
                const caches = (await options.redis.get<StoreCache[]>("stores", logPath))
                ?.map(c => {
                    if(c.socketId === options.client.id) {
                        return {
                            ...c,
                            isOpen: false,
                            socketId: undefined,
                        }
                    }
                    return c
                })
                options.redis.set("stores", 
                    caches === undefined ? [] : caches,
                    logPath
                )
            }
            
            if(options.error) {
                options.client.emit("error", {
                    result: false,
                    message: "failed",
                    data: options.error,
                } as SocketResponseBody<FailedResponse>)
            }
            options.client.disconnect()
        }
        // export const leaveroom = async (
        //     client: Socket, 
        //     options: RoomleaveOptions,
        //     redis: RedisService,
        // ) => {
        //     if(!client.rooms.has(options.gu)) return
        //     const caches = await redis.get<{ storename: string }[]>(options.gu, logPath)
        //     let after : { storename: string }[] = []

        //     if(caches) caches.forEach(c => {
        //         if(c.storename !== options.storename) after.push(c)
        //     })
            
        //     await redis.set(options.gu,
        //         after,
        //         logPath
        //     )
        //     client.leave(options.gu)
        // }
    }

    export namespace MessageHandler {
        export const login = (
            findMerchant: MerchantEntity,
            pass: string, 
            auth: AuthService
        ) : Omit<StoreWalletEntity, "uuid"> => {
            const isVerfify = auth.verifyPass({ pass }, findMerchant.salt, findMerchant.pass)
            if(isVerfify) {
                return {
                    point: findMerchant.store.wallet!.point,
                    sales: findMerchant.store.wallet!.sales,
                    store_uid: findMerchant.store.wallet!.store_uid,
                }
            }
            var error = ERROR.UnAuthorized
            error.substatus = "NotEqualPass"
            throw error
        }
    }
}