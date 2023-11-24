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
        console.log(users)
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
    async publishCode(email: string, pass: string, nickname: string) :
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

        await this.redis.delete(code, UserService.name)
        .then(async _=> {
            await this.redis.set(
                data.email, 
                data, 
                UserService.name,
                600,
            )
        })
        return true
    }
    
    async registUser(email: string) :
    Promise<boolean> {
        const data = await this.redis.get<{ salt: string, hash: string, nickname: string, email: string }>(email, UserService.name)
        if(data === null) {
            var error = ERROR.NotFoundData
            throw error
        }
        const createdUser = await this.userRepository.create({ ...data, uuid: this.auth.getRandUUID() })
        await this._upsertCache(createdUser)
        .then(async _=> await this.redis.delete(email, UserService.name))
        
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
        const findUser : UserEntity = await this._findUser(email)
        const isVerify = this.auth.verifyPass({ pass }, findUser.salt, findUser.pass)
        if(isVerify) {
            // accesstoken과 refreshtoken 발행
            const { accesstoken, refreshtoken } = await this._publishTokens(findUser.email)
            const user = await this.userRepository.updateBy({
                accesstoken: accesstoken,
                refreshtoken: refreshtoken,
            }, findUser.email)

            await this._upsertCache(user)
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
        const findUser : UserEntity = await this._findUser(email)
        return { ...findUser } as UserDto
    }

    /**
     * AccessToken이 만료되었을 경우
     * @param token 
     * @returns User
     */
    async checkRefresh(email: string, token: string) : 
    Promise<UserDto> {
        const findUser = await this._findUserWithToken({ email, token })
        if(!findUser.refreshtoken) {
            var error = ERROR.UnAuthorized
            error.substatus = "ExpiredToken"
            throw error
        }
        else {
            const { payload } = await this.auth.verifyToken(findUser.refreshtoken, true)
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

                await this._upsertCache(user)
                return { ...user } as UserDto
            }

            // 저장되어 있는 토큰 폐기
            const user = await this.userRepository.updateBy({
                accesstoken: null,
                refreshtoken: null,
            }, findUser.email)
            await this._upsertCache(user)
            // 디비에 저장되어 있는 RefreshToken이 오염될 경우에만
            // 에러를 스로잉 함
            var error = ERROR.UnAuthorized
            error.substatus = "ForgeryData"
            throw error
        }
    }

    async deleteUser(email: string) {
        await this.userRepository.deleteBy(email)
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

    /**
     * 캐시정보 갱신 or 등록
     * @param cache 
     */
    private async _upsertCache(cache: UserEntity) :
    Promise<void> {
        let caches : UserEntity[] | null = await this.redis.get<UserEntity[]>("users", UserService.name)
        .catch(err => {
            Logger.error("캐시 업데이트 실패")
            throw err
        })

        if(caches === null) await this.redis.set("users", [cache], UserService.name)
        else {
            let found : boolean = false
            caches = caches.map(c => {
                if(c.email === cache.email) {
                    found = true
                    return cache
                }
                return c
            })

            if(!found) caches.push(cache)
            await this.redis.set("users", caches, UserService.name)
        }
    }

    /**
     * 유저정보조회
     * 
     * AccessToken이 만료된 경우 사용
     * @param email 
     * @param token
     * @returns User
     */
    private async _findUserWithToken(args : Partial<{ email: string, token: string }>) :
    Promise<UserEntity> {
        const user : UserEntity = await this._findUser(args.email)

        var error
        if(user.accesstoken === args.token) return user
        else if(user.accesstoken === null) error = ERROR.NotFoundData
        else {
            error = ERROR.UnAuthorized
            error.substatus = "ForgeryData"
        }

        throw error
    }

    /**
     * 유저정보조회
     * 
     * 캐시된 데이터가 있다면 캐시 데이터를 반환
     * @param email 
     * @returns User
     */
    private async _findUser(email?: string) :
    Promise<UserEntity> {
        const cache = (await this.redis.get<UserEntity[]>("users", UserService.name)
        .catch(err => {
            Logger.error("캐시로드오류")
            throw err
        }))?.find(c => c.email === email)

        if(cache !== undefined) {
            // 레디스에서 가져온 Date 타입이 string 타입으로 바꿔 반환해주기 때문에
            // Date로 변환 해줌
            // .toString()으로 string 타입 변환해주는 이유는
            // 반환 타입이 Date로 출력되지만 Date타입 변수에 넣어주면 타입 오류반환함
            const dates = this._stringToDate([
                cache.createdAt.toString(),
                cache.updatedAt.toString(),
            ])
            cache.createdAt = dates[0]
            cache.updatedAt = dates[1]
            return cache
        }
        return await this.userRepository.getBy({ email })
        .catch(err => {
            Logger.error("유저 정보조회 실패") 
            throw err
        })
    }
}