import { CanActivate, ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { Request } from 'express';
import { ERROR } from "../type/response.type";
import * as dotenv from "dotenv"
dotenv.config()

const logPath = "CouponGuard"
const server_secret = process.env.SERVER_SECRET

@Injectable()
export class CouponGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest()
        const reqAddress = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress
        const secret = this._extractSecretFromHeader(req)
        if(secret === null) {
            req.user = ERROR.UnAuthorized
            Logger.log(`서버 시크릿 코드가 로드 되지 않았습니다\n환경변수를 확인해주세요`, logPath)
            return true
        } else if(secret !== server_secret) {
            req.user = ERROR.UnAuthorized
            Logger.log(`정상적이지 않은 쿠폰발급 요청이 왔습니다\n요청 아이피: ${reqAddress}`, logPath)
            return true
        }
        
        req.user = true
        return true
    }

    private _extractSecretFromHeader(req: Request): string | null {
        const secret = req.headers.authorization ?? null
        return secret
    }
}