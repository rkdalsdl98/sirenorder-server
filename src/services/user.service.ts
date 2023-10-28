import { Injectable, Logger } from "@nestjs/common";
import { UserRepository } from "../repositories/user/user.repository";
import { RedisService } from "./redis.service";
import { EmailService } from "./mail.service";
import { AuthService } from "./auth.service";
import { ConfigService } from "@nestjs/config";
import { ERROR } from "../common/type/response.type";
import { UserEntity } from "../repositories/user/user.entity";
import { UserDto } from "src/dto/user.dto";

@Injectable()
export class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly redis: RedisService,
        private readonly email: EmailService,
        private readonly auth: AuthService,
        private readonly config: ConfigService,
    ){
        this._initialized()
    }

    private async _initialized() :
    Promise<void> {
        const users = await this.userRepository.getMany()
        await this.redis.set("users", users, UserService.name)
        .then(_=> Logger.log("유저정보 인 메모리 캐싱"))
        .catch(err => {
            Logger.error("유저정보 인 메모리 캐싱실패")
            throw err
        })
    }

    /**
     * 메일로 확인 코드 전송
     * @param email 
     * @param pass 
     * @param nickname 
     * @returns boolean
     */
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

    /**
     * 코드 확인 이후 유저 정보 등록
     * @param code 
     * @returns boolean
     */
    async verifyCode(code: string) :
    Promise<boolean> {
        const data = await this.redis.get<{ salt: string, hash: string, nickname: string, email: string }>(code, UserService.name)
        if(data === null) {
            var error = ERROR.NotFoundData
            error.substatus = "NotValidCode"
            throw error
        }
        const createdUser = await this.userRepository.create({ ...data, uuid: this.auth.getRandUUID() })
        await this.redis.get<UserEntity[]>("users", UserService.name)
        .then(async caches => {
            caches = caches === null ? [] : caches
            caches.push(createdUser)
            await this.redis.set("users", caches, UserService.name)
            await this.redis.delete(code, UserService.name)
        })
        .catch(err => {
            Logger.error("캐시처리실패")
            throw err
        })
        return true
    }

    /**
     * 이메일로 대조할 유저 정보 탐색
     * 
     * 없을 경우 에러 스로잉
     * 
     * 입력받은 비밀번호와 대조할 정보에 담겨있는 비밀번호 대조
     * @param email 
     * @param pass 
     * @returns User
     */
    async loginByPass(email: string, pass: string) :
    Promise<UserDto> {
        const findUser = await this.userRepository.getBy({ email })
        .catch(err => {
            Logger.error("유저 정보조회 실패") 
            throw err
         })

        const isVerify = this.auth.verifyPass({ pass }, findUser.salt, findUser.pass)
        if(isVerify) {
            // accesstoken과 refreshtoken 발행
            const { accesstoken, refreshtoken } = await this._publishTokens(findUser.email)
            const user = await this.userRepository.updateBy({
                accesstoken: accesstoken,
                refreshtoken: refreshtoken,
            }, findUser.email)
            return { ...user } as UserDto
        }
        var error = ERROR.UnAuthorized
        error.substatus = "NotEqualPass"
        throw error
    }

    /**
     * AccessToken이 유효하고 Payload또한 오염되지 않을 경우
     * @param email 
     * @returns User
     */
    async loginByEmail(email: string) : 
    Promise<UserDto> {
        const findUser = await this.userRepository.getBy({ email })
        .catch(err => {
            Logger.error("유저 정보조회 실패") 
            throw err
        })
        
        return { ...findUser } as UserDto
    }

    /**
     * AccessToken이 만료되었을 경우
     * @param token 
     * @returns User
     */
    async checkRefresh(token: string) : 
    Promise<UserDto> {
        const findUser = await this.userRepository.getBy({ accesstoken: token })
        .catch(err => {
            Logger.error("유저 정보조회 실패") 
            throw err
        })
        
        if(!findUser.refreshtoken) {
            var error = ERROR.UnAuthorized
            error.substatus = "ExpiredToken"
            throw error
        }
        else {
            const { payload } = await this.auth.verifyToken(findUser.refreshtoken)
            .catch(err => {
                Logger.error("만료된 토큰")
                throw err
            })

            if(payload !== null) {
                // accesstoken과 refreshtoken 갱신
                const { accesstoken, refreshtoken } = await this._publishTokens(findUser.email)
                const user = await this.userRepository.updateBy({
                    accesstoken: accesstoken,
                    refreshtoken: refreshtoken,
                }, findUser.email)
                return { ...user } as UserDto
            }

            // 저장되어 있는 토큰 폐기
            await this.userRepository.updateBy({
                accesstoken: undefined,
                refreshtoken: undefined,
            }, findUser.email)
            // 디비에 저장되어 있는 RefreshToken이 오염될 경우에만
            // 에러를 스로잉 함
            var error = ERROR.UnAuthorized
            error.substatus = "ForgeryData"
            throw error
        }
    }

    /**
     * AccessToken과 RefreshToken을 발행
     * @param email 
     * @returns tokens
     */
    private async _publishTokens(email: string) :
    Promise<{ accesstoken: string, refreshtoken: string}> {
        const { token: accesstoken } = await this.auth.punblishToken({ email })
        const { token: refreshtoken } = await this.auth.punblishToken({ email }, true)
        return { accesstoken, refreshtoken }
    }

    private _stringToDate(str: string | string[]) : 
    | Date
    | Date[] {
        return Array.isArray(str) 
        ? str.map(s => new Date(s))
        : new Date(str)
    }
}