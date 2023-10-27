import { UserService } from "../../services/user.service"
import { Test, TestingModule } from "@nestjs/testing"
import { UserRepository } from "../../repositories/user/user.repository"
import { PrismaService } from "../../services/prisma.service"
import { EmailService } from "../../services/mail.service"
import { AuthService } from "../../services/auth.service"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { RedisService } from "../../services/redis.service"
import { MailerModule } from "@nestjs-modules/mailer"
import { RedisModule } from "../../modules/redis.module"
import { UserEntity } from "src/repositories/user/user.entity"

let db : UserEntity[] = []

describe("UserService", () => {
    let service: UserService
    let repository: UserRepository
    let redis: Record<string, { salt: string, hash: string, nickname: string, email: string }> = {}
    let mailer: EmailService
    let auth: AuthService
    let config: ConfigService

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                RedisModule,
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
                AuthService,
                ConfigService,
                RedisService,
            ]
        }).compile()

        service = module.get<UserService>(UserService)
        repository = module.get<UserRepository>(UserRepository)
        mailer = module.get<EmailService>(EmailService)
        auth = module.get<AuthService>(AuthService)
        config = module.get<ConfigService>(ConfigService)
    })

    it("종속성 모듈 로드", () => {
        expect(service).toBeDefined()
        expect(repository).toBeDefined()
    })

    const registOptions = {
        email: "rkdalsdl12@gmail.com",
        pass: "123456789",
        nickname: "Tester",
    }

    describe("유저 생성", () => {
        it("유저 생성 메일 전송", async () => {
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

    it("코드 검증", async () => {
        jest.spyOn(service, "verifyCode").mockImplementation(async (code: string) => {
            if(redis[code]) {
                const data = redis[code]
                const verify = auth.verify({ pass: "123456789" }, data.salt, data.hash)
                return verify
            }
            console.log("Not found code")
            return false
        })

        expect(await service.verifyCode("123456")).toEqual(true)
    })

    describe("유저 로그인", () => {
        it.todo("토큰 로그인")
        it.todo("패스워드 로그인")
        it.todo("토큰 만료")
    })
})