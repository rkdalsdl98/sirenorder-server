import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    async onModuleDestroy() {
        await this.$disconnect()
        .then(_=> Logger.log("Disconnected databases.", PrismaService.name))
    }
    async onModuleInit() {
        await this.$connect()
        .then(_=> Logger.log("Connected databases.", PrismaService.name))
    }
}