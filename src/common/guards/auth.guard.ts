import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { Request } from 'express';
import { ERROR, FailedResponse } from "../type/response.type";
import { AuthService } from "src/services/auth.service";
import { IPayload } from "../interface/ipayload";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly auth: AuthService
    ){}

    async canActivate(context: ExecutionContext) : Promise<boolean> {
        const req = context.switchToHttp().getRequest()
        const reqAddress = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress
        const token = this._extractTokenFromHeader(req)
        if(token === null) {
            req.user = ERROR.UnAuthorized
            return true
        }
        try {
            const payload = await this._getPayload(token)
            if("email" in payload) {
                if(!payload.email || !/^[0-9a-zA-Z]+@[a-zA-Z]+.[a-zA-Z]{2,3}$/g.test(`${payload.email}`)) {
                    Logger.error(`[이메일 형식이 아님] 요청 아이피: ${reqAddress}`, AuthGuard.name)
                    req.user = ERROR.UnAuthorized
                    return true
                }
                req.user = payload
            } else req.user = ERROR.UnAuthorized
            return true
        } catch(e) {
            if(typeof e === typeof ERROR) {
                const err: typeof ERROR = ({...e} satisfies typeof ERROR)
                Logger.error(`[검증 할 수 없는 토큰] 요청 아이피: ${reqAddress}\n위조데이터 가능성 있음`, AuthGuard.name)
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
}