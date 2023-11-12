import { Injectable, Logger } from "@nestjs/common";
import { IRepository } from "../../common/interface/irepository";
import { PrismaService } from "../../services/prisma.service";
import { LatLng, StoreEntity } from "./store.entity";
import { ERROR } from "../../common/type/response.type";
import { StoreDetailEntity, WeeklyHours } from "./storedetail.entity";
import { OrderEntity } from "../user/order.entity";
import { MenuInfo } from "src/common/type/order.typs";

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

    async getOrders(storeId: string): Promise<OrderEntity[]> {
        return (await this.prisma.order.findMany({
            where: { store_uid: storeId }
        }).catch(err => {
            Logger.error("데이터를 불러오는데 실패했습니다.", err.toString(), StoreRepository)
            throw ERROR.ServerDatabaseError
        })).map(o => this.parsingOrderEntity(o))
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
            sirenorderhours: e.sirenorderhours as WeeklyHours,
            phonenumber: e.phonenumber,
            parkinginfo: e.parkinginfo,
            waytocome: e.waytocome,
        } as StoreDetailEntity
    }

    parsingOrderEntity(e) : OrderEntity {
        if(!e) throw ERROR.NotFoundData
        return {
            totalprice: e.totalprice,
            saleprice: e.saleprice,
            store_uid: e.store_uid,
            deliveryinfo: e.deliveryinfo,
            menus: e.menus.map(m => m as MenuInfo),
        } as OrderEntity
    }
}