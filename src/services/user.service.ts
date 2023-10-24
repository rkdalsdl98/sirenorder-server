import { Injectable } from "@nestjs/common";
import { UserRepository } from "src/repositories/user/user.repository";
import { RedisService } from "./redis.service";

@Injectable()
export class UserService {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly redis: RedisService,
    ){}
}