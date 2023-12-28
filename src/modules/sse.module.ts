import { Module } from "@nestjs/common";
import { SSEService } from "src/services/sse.service";
import { RedisModule } from "./redis.module";
import { SSEController } from "src/controllers/sse.controller";

@Module({
    imports: [RedisModule],
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