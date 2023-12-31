import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { pbkdf2Sync, randomBytes } from "crypto";
import { IPayload } from "../common/interface/ipayload";
import { JwtFactory } from "../common/jwt/jwtfactory";
import { v4 } from "uuid"

@Injectable()
export class AuthService {
    constructor(
        private readonly config: ConfigService,
        private readonly jwtFactory: JwtFactory,
    ){}

    /**
     * 데이터 단방향 암호화
     * @param data 
     * @param salt? 
     * @returns Object { salt: string, hash: string }
     */
    encryption(data: Object, salt?: string, len?: number) : { salt: string, hash: string } {
        const bufferEncoding : BufferEncoding | undefined = this.config.get<string>("AUTH_BUFFER_ENCODING") as BufferEncoding
        const encoding : BufferEncoding | undefined = this.config.get<string>("AUTH_ENCODING") as BufferEncoding
        const interation : number | undefined = parseInt(this.config.get<string>("AUTH_ITERATION") ?? "10000")
        const keyLen : number | undefined = parseInt(this.config.get<string>("AUTH_KEY_LEN") ?? "64")
        const algorithm : string | undefined = this.config.get<string>("AUTH_ALGORITHM") ?? "sha256"

        if(!salt) {
            const randByteStr = randomBytes(32).toString(encoding ?? "base64")
            const uid = v4()
            salt = `${uid}:${randByteStr}`
        }

        const buffer : Buffer = Buffer.from(JSON.stringify(data), bufferEncoding ?? "utf-8")
        const hash = pbkdf2Sync(
            buffer, 
            salt, 
            interation, 
            len ?? keyLen, 
            algorithm,
        ).toString(encoding ?? "base64")
        
        return { salt, hash }
    }

    /**
     * 유효한 데이터 여부 검증
     * @param data 
     * @param salt 
     * @param comparedHash 
     * @returns boolean
     */
    verifyPass(data: Object, salt: string, comparedHash: string) : boolean {
        const { hash } = this.encryption(data, salt)
        return hash === comparedHash
    }

    async punblishToken(payload: Object | Buffer, isRefresh: boolean = false) : 
    Promise<{ token: string }> {
        return await this.jwtFactory.publishToken(payload, isRefresh)
    }

    async verifyToken(token: string, isRefresh: boolean = false) : 
    Promise<{ payload: IPayload }> {
        return await this.jwtFactory.verifyToken(token, isRefresh)
    }

    /**
     * @returns uuid
     */
    getRandUUID() : string { return v4() }
    /**
     * 랜덤 문자열 반환
     * 
     * 기본 문자열 길이 값 6
     * @param len 
     * @returns Rand code
     */
    generateRandStr(len?: number) : string {
        return randomBytes(32).toString("base64").substring(0, len ?? 6)
    }
}