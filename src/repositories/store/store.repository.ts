import { Injectable } from "@nestjs/common";
import { IRepository } from "src/common/interface/irepository";
import { PrismaService } from "src/services/prisma.service";
import { StoreEntity } from "./store.entity";

@Injectable()
export class StoreRepository implements IRepository<StoreEntity, null>  {
    constructor(
        private readonly prisma: PrismaService,
    ){}

    async getBy(args: unknown): Promise<StoreEntity | null> {
        return null
    }

    async getMany(): Promise<StoreEntity[]> {
        return []
    }
}