import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { Request } from 'express';
import { ERROR, FailedResponse } from "../type/response.type";
import { AuthService } from "src/services/auth.service";
import { IPayload } from "../interface/ipayload";

@Injectable()
export class SSEGuard implements CanActivate {
    constructor(
        private readonly auth: AuthService
    ){}

    async canActivate(context: ExecutionContext) : Promise<boolean> {
        const req = context.switchToHttp().getRequest()
        const reqAddress = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress
        const token = this._extractTokenFromHeader(req)
        
        if(token === null) throw ERROR.UnAuthorized
        try {
            const payload = await this._getPayload(token)
            if("email" in payload) {
                if(!payload.email || !/^[0-9a-zA-Z]+@[a-zA-Z]+.[a-zA-Z]{2,3}$/g.test(`${payload.email}`)) {
                    Logger.error(`[이메일 형식이 아님] 요청 아이피: ${reqAddress}`, SSEGuard.name)
                    throw new HttpException("유효하지 않은 데이터 입니다.", HttpStatus.UNAUTHORIZED)
                }
                req.user = payload
            } else throw ERROR.UnAuthorized
            return true
        } catch(e) {
            if(typeof e === typeof ERROR) {
                const err: typeof ERROR = ({...e} satisfies typeof ERROR)
                Logger.error(`[유효하지 않은 토큰] ${err.substatus ?? ""}`, SSEGuard.name)
            }
            throw new HttpException(e, HttpStatus.UNAUTHORIZED)
        }
    }

    private _extractTokenFromHeader(request: Request): string | null {
        const [ type, token ] = request.headers.authorization?.split(" ") ?? []
        if(!type || type !== "Bearer") return null
        return token
    }

    private async _getPayload(token: string) :
    Promise<IPayload | FailedResponse> {
        try {
            let { payload } = await this.auth.verifyToken(token)
            return payload
        } catch(e) { return e }
    }
}