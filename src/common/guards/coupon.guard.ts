import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { Request } from 'express';
import * as dotenv from "dotenv"
dotenv.config()

const logPath = "CouponGuard"
const server_secret = process.env.SERVER_SECRET

@Injectable()
export class CouponGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
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
        const secret = this._extractSecretFromHeader(req)
        if(server_secret === null) {
            Logger.log(`서버 시크릿 코드가 로드 되지 않았습니다\n환경변수를 확인해주세요`, logPath)
            throw new HttpException("서버에서 검증을 위한 준비가 되지 않아 요청이 취소됩니다.", HttpStatus.ACCEPTED)
        } else if(secret !== server_secret) {
            Logger.log(`정상적이지 않은 쿠폰발급 요청이 왔습니다\n요청 아이피: ${address}`, logPath)
            throw new HttpException("해당 요청에 필요한 자격 증명에 실패 했습니다.", HttpStatus.UNAUTHORIZED)
        }
        
        req.user = true
        return true
    }

    private _extractSecretFromHeader(req: Request): string | null {
        const secret = req.headers.authorization ?? null
        return secret
    }

    private _getRequestIP(req: Request) {
        const address: string | undefined = req.socket.remoteAddress
        if(!address) return null
        
        const pureAddr = address.match(/([0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3})/)
        if(!pureAddr) return "localhost"
        return pureAddr[0]
    }
}