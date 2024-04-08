import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { Request } from 'express';
import { ERROR } from "../type/response.type";
import { AuthService } from "src/services/auth.service";
import { IPayload } from "../interface/ipayload";

const logPath = "AuthGuard"

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly auth: AuthService
    ){}

    async canActivate(context: ExecutionContext) : Promise<boolean> {
        if(context.getType() !== "http") {
            Logger.log(`올바르지 않은 요청이 들어왔습니다\n프로토콜: ${context.getType()}`, logPath)
            throw new HttpException("올바르지 않은 요청입니다.", HttpStatus.BAD_GATEWAY)
        }
        const req = context.switchToHttp().getRequest()
        const address: string | null = this._getRequestIP(req)
        if(!address) {
            Logger.error("[출처를 알 수 없는 비 정상적 접근]", logPath)
            throw new HttpException("비 정상적인 접근 방법으로 서버에서 요청을 차단 했습니다.", HttpStatus.FORBIDDEN)
        }
        const token = this._extractTokenFromHeader(req)
        if(token === null) {
            req.user = ERROR.UnAuthorized
            return true
        }
        try {
            const payload = await this._getPayload(token)
            if("email" in payload) {
                if(!payload.email || !/^[0-9a-zA-Z]+@[a-zA-Z]+.[a-zA-Z]{2,3}$/g.test(`${payload.email}`)) {
                    Logger.error(`[이메일 형식이 아님] 요청 아이피: ${address}`, logPath)
                    req.user = ERROR.UnAuthorized
                    return true
                }
                req.user = payload
            } else req.user = ERROR.UnAuthorized
            return true
        } catch(e) {
            if(typeof e === typeof ERROR) {
                Logger.error(`[검증 할 수 없는 토큰] 요청 아이피: ${address}\n위조데이터 가능성 있음`, logPath)
            }
            throw new HttpException(e, HttpStatus.FORBIDDEN)
        }
    }

    private _extractTokenFromHeader(request: Request): string | null {
        const [ type, token ] = request.headers.authorization?.split(" ") ?? []
        if(!type || type !== "Bearer") return null
        return token
    }

    private async _getPayload(token: string) :
    Promise<IPayload> {
        let { payload } = await this.auth.verifyToken(token)
        return payload
    }

    private _getRequestIP(req: Request) {
        const address: string | undefined = req.socket.remoteAddress
        if(!address) return null
        
        const pureAddr = address.match(/([0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3})/)
        if(!pureAddr) return "localhost"
        return pureAddr[0]
    }
}