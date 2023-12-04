import { Module } from "@nestjs/common"
import { JwtModule } from "./jwt.module";
import { AuthService } from "../services/auth.service";

@Module({
    imports: [JwtModule],
    providers: [
        AuthService,
    ],
    exports: [
        AuthService,
    ]
})
export class AuthModule {}