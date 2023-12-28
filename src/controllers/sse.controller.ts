import { TypedQuery } from "@nestia/core";
import { Controller, Req, Sse } from "@nestjs/common";
import { Request } from "express";
import { SSEQuery } from "src/query/sse.query";
import { SSEService } from "src/services/sse.service";

@Controller("sse")
export class SSEController {
    constructor(
        private readonly sseService: SSEService,
    ){}

    @Sse('listen')
    sse(
        @Req() request: Request,
        @TypedQuery() query: SSEQuery.SSEQueryListenOptions,
    ) {
        try {
            request.on('close', () => this.sseService.disconnectSSE(query.listener_email))
            return this.sseService.listenSSE(query.listener_email)
        } catch(e) { return e }
    }
}