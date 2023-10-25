import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserController } from "src/controllers/user.controller";
import { UserRepository } from "src/repositories/user/user.repository";
import { AuthService } from "src/services/auth.service";
import { EmailService } from "src/services/mail.service";
import { PrismaService } from "src/services/prisma.service";
import { RedisService } from "src/services/redis.service";
import { UserService } from "src/services/user.service";

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