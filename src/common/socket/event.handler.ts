import { Socket } from "socket.io";
import { RoomJoinOptions, RoomleaveOptions } from "../type/socket.type";
import { RedisService } from "src/services/redis.service";

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
            options: RoomleaveOptions, 
            redis: RedisService
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
}