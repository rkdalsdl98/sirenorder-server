import { Controller, Req, Sse, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { AuthDecorator } from "src/common/decorators/auth.decorator";
import { SSEGuard } from "src/common/guards/sse.guard";
import { SSEService } from "src/services/sse.service";

@Controller("sse")
export class SSEController {
    constructor(
        private readonly sseService: SSEService,
    ){}

    // 리프레시 토큰여부를 체크할 필요가 없어
    // AccessToken이 유효하지 않다면 오류 반환
    @Sse('listen')
    @UseGuards(SSEGuard)
    sse(
        @Req() request: Request,
        @AuthDecorator.GetTokenAndPayload() data: { payload: any, token:string },
    ) {
        try {
            const listener_email = data.payload.email
            request.on('close', () => this.sseService.disconnectSSE(listener_email))
            return this.sseService.listenSSE(listener_email)
        } catch(e) { return e }
    }
}