import { Module } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt";
import { JwtFactory } from "../common/jwt/jwtfactory";
import { ConfigService } from "@nestjs/config";

@Module({
    providers: [
        JwtFactory,
        JwtService,
        ConfigService,
    ],
    exports: [JwtFactory]
})
export class JwtModule {}