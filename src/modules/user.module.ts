import { Module } from "@nestjs/common";
import { UserController } from "src/controllers/user.controller";
import UserRepository from "src/repositories/user/user.repository";
import { RedisService } from "src/services/redis.service";
import { UserService } from "src/services/user.service";

@Module({
    providers: [
        UserService,
        RedisService,
        UserRepository,
    ],
    controllers: [UserController],
})
export class UserModule {}