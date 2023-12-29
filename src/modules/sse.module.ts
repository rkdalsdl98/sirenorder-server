import { Module } from "@nestjs/common";
import { SSEService } from "src/services/sse.service";
import { SSEController } from "src/controllers/sse.controller";
import { AuthModule } from "./auth.module";

@Module({
    imports: [AuthModule],
    providers: [
        SSEService,
    ],
    controllers: [
        SSEController,
    ],
    exports: [
        SSEService,
    ],
})
export class SSEModule {}