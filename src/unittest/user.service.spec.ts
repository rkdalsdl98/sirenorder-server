import { UserService } from "../services/user.service"
import { Test, TestingModule } from "@nestjs/testing"
import { UserRepository } from "../repositories/user/user.repository"
import { PrismaService } from "../services/prisma.service"
import { EmailService } from "../services/mail.service"
import { AuthService } from "../services/auth.service"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { RedisService } from "../services/redis.service"
import { MailerModule } from "@nestjs-modules/mailer"
import { RedisModule } from "../modules/redis.module"
import { UserEntity } from "../repositories/user/user.entity"
import { AuthModule } from "../modules/auth.module"
import { JwtFactory } from "../common/jwt/jwtfactory"
import { JwtService } from "@nestjs/jwt"

let db : UserEntity[] = []

describe("UserService", () => {
    let service: UserService
    let redis: Record<string, { salt: string, hash: string, nickname: string, email: string }> = {}
    let mailer: EmailService
    let auth: AuthService
    let config: ConfigService
    let jwtFactory: JwtFactory
    let jwtService: JwtService

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                RedisModule,
                AuthModule,
                ConfigModule.forRoot({
                    isGlobal: true,
                  }),
                MailerModule.forRootAsync({
                imports: [ConfigModule],
                inject: [ConfigService],
                    useFactory: (config: ConfigService) => ({
                        transport: `smtps://${config.get<string>("AUTH_EMAIL")}:${config.get<string>("AUTH_PASSWORD")}@${config.get<string>("EMAIL_HOST")}`,
                        defaults: {
                        from: `"${config.get<string>("EMAIL_FROM_USER_NAME")}" <${config.get<string>("AUTH_EMAIL")}>`,
                        },
                    })
                }),
            ],
            providers: [
                UserService,
                UserRepository,
                PrismaService,
                EmailService,
                JwtService,
                JwtFactory,
                AuthService,
                ConfigService,
                RedisService,
            ]
        }).compile()

        service = module.get<UserService>(UserService)
        mailer = module.get<EmailService>(EmailService)
        auth = module.get<AuthService>(AuthService)
        config = module.get<ConfigService>(ConfigService)
        jwtFactory = module.get<JwtFactory>(JwtFactory)
        jwtService = module.get<JwtService>(JwtService)
    })

    it("종속성 모듈 로드", () => {
        expect(service).toBeDefined()
        expect(mailer).toBeDefined()
        expect(auth).toBeDefined()
        expect(config).toBeDefined()
        expect(jwtFactory).toBeDefined()
        expect(jwtService).toBeDefined()
    })

    const registOptions = {
        email: "rkdalsdl12@gmail.com",
        pass: "123456789",
        nickname: "Tester",
    }

    describe("유저 생성", () => {
        it("인증 메일 전송", async () => {
            jest.spyOn(service, "registUser").mockImplementation(async (
                email: string,
                pass: string,
                nickname: string,
            ) => {
                let result : boolean = true
                const { salt, hash } = auth.encryption({ pass })
                const code = "123456"
                redis[code] = { salt, hash, nickname, email }

                await mailer.sendMail({
                    secret: code,
                    title: "Siren Order 회원가입 인증 코드",
                    to: email
                }).catch(e=> {
                    console.log("메일 전송실패")
                    console.log(e)
                    result = false
                })
                return result
            })
    
            expect(await service.registUser(
                registOptions.email,
                registOptions.pass,
                registOptions.nickname,
            )).toEqual(true)
        })
    })

    it("인증 코드 검증", async () => {
        jest.spyOn(service, "verifyCode").mockImplementation(async (code: string) => {
            if(redis[code]) {
                const data = redis[code]
                const user : UserEntity = {
                    uuid: auth.getRandUUID(),
                    email: data.email,
                    nickname: data.nickname,
                    salt: data.salt,
                    pass: data.hash,
                    wallet: null,
                    gifts: [],
                    coupons: [],
                    order: null,
                    orderhistory: [],
                    accesstoken: null,
                    refreshtoken: null,
                    createdAt: new Date(Date.now()),
                    updatedAt: new Date(Date.now()),
                }
                
                db.push(user)
                return true
            }
            console.log("Not found secret code")
            return false
        })

        expect(await service.verifyCode("123456")).toEqual(true)
    })

    let testingUser : UserEntity
    let accesstoken : string
    let refreshtoken : string

    describe("유저 로그인", () => {
        it("패스워드 로그인", async () => {
            var error = null
            const findUser = db.find(u => u.email === "rkdalsdl12@gmail.com")
            expect(findUser).toBeDefined()

            if(findUser) {
                const isVerify = auth.verifyPass({ pass: "123456789" }, findUser.salt, findUser.pass)
                expect(isVerify).toEqual(true)

                if(isVerify) {
                    const { token: access } = await auth.punblishToken({ email: findUser.email })
                    const { token: refresh } = await auth.punblishToken({ email: findUser.email }, true)
                    accesstoken = access
                    refreshtoken = refresh
                    
                    const afterDB : UserEntity[] = []
                    db.forEach(u => {
                        if(u.email === findUser.email) {
                            testingUser = {
                                ...u,
                                accesstoken,
                                refreshtoken
                            }
                            afterDB.push(testingUser)
                        }
                    })

                    expect(testingUser).toBeDefined()
                    expect(accesstoken).toBeDefined()
                    expect(refreshtoken).toBeDefined()
                }
            }

            expect(error).toBeNull()
        })

        it("토큰 로그인", async () => {
            var error = null
            const { payload } = await auth.verifyToken(accesstoken)
            .catch(err => error = err)
            expect(payload).not.toBeNull()
            expect(payload.email).toBeDefined()

            if(payload) {
                const validFormat = /^[0-9a-zA-Z]+@[a-zA-Z]+.[a-zA-Z]{2,3}$/g.test(`${payload.email}`)
                expect(validFormat).toEqual(true)

                if(validFormat) {
                    const findUser = db.find(u => u.email === "rkdalsdl12@gmail.com")
                    expect(findUser).toBeDefined()
                }
            }

            expect(error).toBeNull()
        })
        it("토큰 만료", async () => {
            jest.spyOn(jwtFactory, "publishToken").mockImplementation(async (payload) => {
                const token : string = await jwtService.signAsync(payload, {
                    secret: config.get<string>("JWT_SECRET"),
                    expiresIn: 0,
                })
                return { token }
            })
            var error = null
            const { token: refresh } = await jwtFactory.publishToken({ email: "test@gmail.com" }, true)
            
            try {
                await auth.verifyToken(refresh, true)
            } catch(e) {
                error = e
            }
            expect(error).not.toBeNull()
            expect(error).toHaveProperty("substatus", "ExpiredToken")
            expect(error).toHaveProperty("status", 401)
        })
    })
})