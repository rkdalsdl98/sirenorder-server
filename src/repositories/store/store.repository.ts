import { Injectable, Logger } from "@nestjs/common";
import { IRepository } from "../../common/interface/irepository";
import { PrismaService } from "../../services/prisma.service";
import { LatLng, StoreEntity } from "./store.entity";
import { ERROR } from "../../common/type/response.type";
import { SirenOrderHours, StoreDetailEntity, WeeklyHours } from "./storedetail.entity";

@Injectable()
export class StoreRepository implements IRepository<StoreEntity, StoreDetailEntity>  {
    constructor(
        private readonly prisma: PrismaService,
    ){}

    async getBy(id: number): Promise<StoreDetailEntity> {
        return this.parsingDetailEntity(await this.prisma.storedetail.findUnique({ 
            where: { id }
        }).catch(err => {
            Logger.error("데이터를 불러오는데 실패했습니다.", err.toString(), StoreRepository)
            throw ERROR.ServerDatabaseError
        }))
    }

    async getMany(): Promise<StoreEntity[]> {
        return (await this.prisma.store.findMany({ 
            include: { detail: { select: { id: true }} }
        }).catch(err => {
            Logger.error("데이터를 불러오는데 실패했습니다.", err.toString(), StoreRepository)
            throw ERROR.ServerDatabaseError
        })).map(e => this.parsingEntity(e))
    }

    parsingEntity(e) : StoreEntity {
        return {
            storename: e.storename,
            thumbnail: e.thumbnail,
            location: e.location as LatLng,
            address: e.address,
            detail: e.detail.id,
        } as StoreEntity
    }

    parsingDetailEntity(e) : StoreDetailEntity {
        if(!e) throw ERROR.NotFoundData
        return {
            description: e.description,
            images: e.images,
            openhours: e.openhours as WeeklyHours,
            sirenorderhours: e.sirenorderhours as SirenOrderHours,
            phonenumber: e.phonenumber,
            parkinginfo: e.parkinginfo,
            waytocome: e.waytocome,
        } as StoreDetailEntity
    }
}