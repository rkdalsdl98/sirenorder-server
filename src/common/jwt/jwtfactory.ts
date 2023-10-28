import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { IPayload } from "../interface/ipayload";
import { ERROR } from "../type/response.type";

@Injectable()
export class JwtFactory {
    constructor(
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
    ){}

    /**
     * @param payload 발행될 토큰에 들어갈 데이터
     * @returns token { accessToken: string }
     */
    async publishToken(payload: Buffer | Object, isRefresh: boolean) : 
    Promise<{ token: string }> {
        const token : string = await this.jwtService.signAsync(payload, {
            secret: this.config.get<string>("JWT_SECRET"),
            expiresIn: (this.config.get<number>("JWT_EXPIRATION") ?? 30) * 60 * (isRefresh ? 24 : 1),
        })
        return { token }
    }

    /**
     * @param token 검증 할 토큰
     * @param isRefresh 검증 할 토큰이 RefreshToken 인지
     * @returns IPayload | null
     */
    async verifyToken(token: string, isRefresh: boolean) :
    Promise<{ payload: IPayload | null }> {
        const payload = await this.jwtService.verifyAsync(token, { 
            secret: this.config.get<string>("JWT_SECRET"),
            ignoreExpiration: true,
        })
        
        const { exp } = payload
        const now = Date.now() / 1000
        
        // Refreshtoken일 경우 에러 스로잉
        // 아니라면 null payload 반환하여 Refreshtoken으로 재요청 요구
        if(!exp || now > exp) {
            if(isRefresh) {
                var error = ERROR.UnAuthorized
                error.substatus = "ExpiredToken"
                throw error
            }
            return { payload: null }
        }
        
        if("email" in payload) {
            return { payload: payload as IPayload.IPayloadUser }
        }

        throw ERROR.UnAuthorized
    }
}