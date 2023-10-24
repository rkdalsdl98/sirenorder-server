import { TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserService } from "src/services/user.service";

@Controller('user')
@ApiTags("유저")
export class UserController {
    constructor(
        private readonly userService: UserService
    ){}

    @TypedRoute.Post("regist")
    async registUser() {}

    @TypedRoute.Post("login")
    async loginUser() {}
}