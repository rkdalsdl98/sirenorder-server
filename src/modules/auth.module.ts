import { Module } from "@nestjs/common"
import { JwtModule } from "./jwt.module";
import { JwtFactory } from "src/common/jwt/jwtfactory";
import { AuthService } from "src/services/auth.service";

@Module({
    imports: [JwtModule],
    providers: [
        JwtFactory,
        AuthService,
    ],
    exports: [AuthService]
})
export class AuthModule {}