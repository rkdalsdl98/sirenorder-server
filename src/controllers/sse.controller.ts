import { TypedQuery } from "@nestia/core";
import { Controller, Req, Sse, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { AuthDecorator } from "src/common/decorators/auth.decorator";
import { SSEGuard } from "src/common/guards/sse.guard";
import { ERROR } from "src/common/type/response.type";
import { SSEQuery } from "src/query/sse.query";
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
        @TypedQuery() query: SSEQuery.SSEQueryListenOptions,
        @AuthDecorator.GetTokenAndPayload() data: { payload: any, token:string },
    ) {
        try {
            if("email" in data.payload 
            && "authorized" in data.payload
            && (data.payload.authorized as boolean)) {
                request.on('close', () => this.sseService.disconnectSSE(query.listener_email))
                return this.sseService.listenSSE(query.listener_email)
            } else throw ERROR.UnAuthorized
        } catch(e) { return e }
    }
}