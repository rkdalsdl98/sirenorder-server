import { Injectable, Logger } from "@nestjs/common";
import { UserRepository } from "../repositories/user/user.repository";
import { RedisService } from "./redis.service";
import { EmailService } from "./mail.service";
import { AuthService } from "./auth.service";
import { ConfigService } from "@nestjs/config";
import { ERROR } from "../common/type/response.type";
import { UserEntity } from "../repositories/user/user.entity";

@Injectable()
export class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly redis: RedisService,
        private readonly email: EmailService,
        private readonly auth: AuthService,
        private readonly config: ConfigService,
    ){}

    async registUser(email: string, pass: string, nickname: string) :
    Promise<boolean> {
        const { salt, hash } = this.auth.encryption({ pass })
        const code = this.auth.generateRandStr()
        await this.redis.set(
            code, 
            { salt, hash, nickname, email }, 
            UserService.name, 
            this.config.get<number>("EMAIL_TTL") ?? 60,
        )
        .then(async _=> await this.email.sendMail({
            secret: code,
            title: "Siren Order 회원가입 인증 코드",
            to: email
        }).catch(_=> {
            Logger.log("메일 전송실패", UserService.name)
            throw ERROR.FailedSendMail
        }))
        .catch(async err => {
            await this.redis.delete(code, UserService.name)
            throw err
        })
        
        return true
    }

    async verifyCode(code: string) :
    Promise<boolean> {
        const data = await this.redis.get<{ salt: string, hash: string, nickname: string, email: string }>(code, UserService.name)
        if(data === null) {
            var error = ERROR.NotFound
            error.substatus = "NotValidCode"
            throw error
        }

        const createdUser = await this.userRepository.create({ ...data, uuid: this.auth.getRandUUID() })
        await this.redis.get<UserEntity[]>("users", UserService.name)
        .then(async cacahes => {
            cacahes = cacahes === null ? [] : cacahes
            cacahes.push(createdUser)
            await this.redis.set("users", cacahes, UserService.name)
            await this.redis.delete(code, UserService.name)
        })
        .catch(_=> Logger.error("캐시처리실패"))
        return true
    }
}