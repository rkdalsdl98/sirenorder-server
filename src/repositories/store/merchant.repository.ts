import { Injectable, Logger } from "@nestjs/common";
import { IRepository } from "../../common/interface/irepository";
import { MerchantEntity } from "./merchant.entity";
import { PrismaService } from "../../services/prisma.service";
import { StoreEntity } from "./store.entity";
import { ERROR } from "../../common/type/response.type";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { SalesEntity } from "./sales.entity";
import { SirenOrderHours, StoreDetailEntity, WeeklyHours } from "./storedetail.entity";

@Injectable()
export class MerchantRepository implements IRepository<MerchantEntity, undefined> {
    constructor(
        private readonly prisma: PrismaService,
    ){}

    async getBy(args: {
        uuid: string
    }): Promise<MerchantEntity> {
        return this.parsingEntity(await this.prisma.merchant.findUnique({ 
            where: { uuid: args.uuid },
            include: { store: true }
        })
        .catch(err => {
            Logger.error("데이터를 불러오는데 실패했습니다.", err.toString(), MerchantRepository.name)
            throw ERROR.ServerDatabaseError
        }))
    }
    
    async updateBy(
        updateData: Partial<Omit<StoreEntity, "uuid" | "wallet" | "detailId">>, 
        args: {
        uuid: string 
    }): Promise<MerchantEntity> {
        return this.parsingEntity(await this.prisma.merchant.update({
            where: { uuid: args.uuid},
            data: {
                store: {
                    update: {
                        data: {
                            storename: updateData.storename,
                            thumbnail: updateData.thumbnail,
                            location: updateData.location,
                            address: updateData.address,
                        }
                    }
                }
            },
            include: { store: true }
        })
        .catch(err => {
            if(err instanceof PrismaClientKnownRequestError) {
                switch(err.code) {
                    case "P2025":
                        throw ERROR.NotFoundData
                }
            }
            Logger.error("데이터를 갱신하는데 실패했습니다.", err.toString(), MerchantRepository.name)
            throw ERROR.ServerDatabaseError
        }))
    }

    async updateSalesBy(
        updateDate: Partial<Omit<SalesEntity, "id">>,
        args: {
        salesId: number
        uuid?: string,
    }) :
    Promise<SalesEntity> {
        return this.parsingSalesEntity(await this.prisma.sales.upsert({
            where: { id: args.salesId },
            update: {
                amounts: updateDate.amounts,
                menuinfo: updateDate.menuinfo,
                salesdate: updateDate.salesdate,
            },
            create: {
                amounts: updateDate.amounts,
                menuinfo: updateDate.menuinfo,
                salesdate: updateDate.salesdate!,
                currwallet: {
                    connect: { uuid: args.uuid }
                }
            }
        }).catch(err => {
            if(err instanceof PrismaClientKnownRequestError) {
                switch(err.code) {
                    case "P2025":
                        throw ERROR.NotFoundData
                }
            }
            Logger.error("데이터를 갱신하는데 실패했습니다.", err.toString(), MerchantRepository.name)
            throw ERROR.ServerDatabaseError
        }))
    }

    async updateDetailBy(
        updateDate: Partial<StoreDetailEntity>,
        args: {
        detailId: number
    }) :
    Promise<StoreDetailEntity> {
        return this.parsingDetailEntity(await this.prisma.storedetail.update({
            where: { id: args.detailId },
            data: {
                description: updateDate.description,
                images: updateDate.images,
                openhours: updateDate.openhours,
                sirenorderhours: updateDate.sirenorderhours,
                phonenumber: updateDate.phonenumber,
                parkinginfo: updateDate.parkinginfo,
                waytocome: updateDate.waytocome,
            }
        }).catch(err => {
            if(err instanceof PrismaClientKnownRequestError) {
                switch(err.code) {
                    case "P2025":
                        throw ERROR.NotFoundData
                }
            }
            Logger.error("데이터를 갱신하는데 실패했습니다.", err.toString(), MerchantRepository.name)
            throw ERROR.ServerDatabaseError
        }))
    }

    parsingEntity(e) : MerchantEntity {
        return {
            pass: e.pass,
            salt: e.salt,
            store: e.store as StoreEntity,
        } as MerchantEntity
    }

    parsingSalesEntity(e) : SalesEntity {
        return {
            amounts: e.amounts,
            menuinfo: e.menuinfo,
            salesdate: e.salesdate,
        } as SalesEntity
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