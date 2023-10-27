import { Module } from "@nestjs/common"
import { JwtModule } from "./jwt.module";
import { JwtFactory } from "../common/jwt/jwtfactory";
import { AuthService } from "../services/auth.service";
import { JwtService } from "@nestjs/jwt";

@Module({
    imports: [JwtModule],
    providers: [
        JwtFactory,
        JwtService,
        AuthService,
    ],
    exports: [
        AuthService,
        JwtFactory,
    ]
})
export class AuthModule {}