import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserController } from "../controllers/user.controller";
import { UserRepository } from "../repositories/user/user.repository";
import { AuthService } from "../services/auth.service";
import { EmailService } from "../services/mail.service";
import { PrismaService } from "../services/prisma.service";
import { RedisService } from "../services/redis.service";
import { UserService } from "../services/user.service";

@Module({
    providers: [
        UserService,
        PrismaService,
        UserRepository,
        EmailService,
        AuthService,
        ConfigService,
        RedisService,
    ],
    controllers: [UserController],
})
export class UserModule {}