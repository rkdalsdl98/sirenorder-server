import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserController } from "../controllers/user.controller";
import { UserRepository } from "../repositories/user/user.repository";
import { EmailService } from "../services/mail.service";
import { RedisService } from "../services/redis.service";
import { UserService } from "../services/user.service";
import { JwtModule } from "./jwt.module";
import { AuthModule } from "./auth.module";

@Module({
    imports: [
        JwtModule,
        AuthModule,
    ],
    providers: [
        UserService,
        UserRepository,
        EmailService,
        ConfigService,
        RedisService,
    ],
    controllers: [UserController],
})
export class UserModule {}