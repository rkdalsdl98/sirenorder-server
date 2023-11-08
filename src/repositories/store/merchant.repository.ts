import { Injectable, Logger } from "@nestjs/common";
import { IRepository } from "../../common/interface/irepository";
import { MerchantEntity } from "./merchant.entity";
import { PrismaService } from "../../services/prisma.service";
import { StoreEntity } from "./store.entity";
import { ERROR } from "../../common/type/response.type";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { SalesEntity } from "./sales.entity";
import { SirenOrderHours, StoreDetailEntity, WeeklyHours } from "./storedetail.entity";
import { MerchantDto } from "src/dto/merchant.dto";

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
            include: {
                store: {
                    select: {
                        detail: { select: { id: true }},
                        address: true,
                        thumbnail: true,
                        location: true,
                        storename: true,
                        wallet: true,
                    }
                }
            }
        })
        .catch(err => {
            Logger.error("데이터를 불러오는데 실패했습니다.", err.toString(), MerchantRepository.name)
            throw ERROR.ServerDatabaseError
        }))
    }

    async create(args: {
        createData: Omit<MerchantDto, "pass">,
        uuids: { merchant: string, store: string, wallet: string },
        pass: string,
        salt: string,
    }): Promise<MerchantEntity> {
        return this.parsingEntity(await this.prisma.merchant.create({
            data: {
                uuid: args.uuids.merchant,
                pass: args.pass,
                salt: args.salt,
                store: {
                    create: {
                        uuid: args.uuids.store,
                        address: args.createData.storeinfo.storeaddress,
                        location: {
                            latitude: 0,
                            longitude: 0,
                        },
                        storename: args.createData.storeinfo.storename,
                        thumbnail: args.createData.storeinfo.thubmnail,
                        detail: {
                            create: {
                                images: args.createData.storeinfo.detail.images,
                                openhours: {
                                    mon: args.createData.storeinfo.detail.hours.openhours,
                                    tue: args.createData.storeinfo.detail.hours.openhours,
                                    thur: args.createData.storeinfo.detail.hours.openhours,
                                    wed: args.createData.storeinfo.detail.hours.openhours,
                                    fri: args.createData.storeinfo.detail.hours.openhours,
                                    sat: args.createData.storeinfo.detail.hours.openhours,
                                    sun: args.createData.storeinfo.detail.hours.openhours,
                                } as WeeklyHours,
                                sirenorderhours: {
                                    mon: args.createData.storeinfo.detail.hours.sirenorderhours.sirenorder,
                                    tue: args.createData.storeinfo.detail.hours.sirenorderhours.sirenorder,
                                    thur: args.createData.storeinfo.detail.hours.sirenorderhours.sirenorder,
                                    wed: args.createData.storeinfo.detail.hours.sirenorderhours.sirenorder,
                                    fri: args.createData.storeinfo.detail.hours.sirenorderhours.sirenorder,
                                    sat: args.createData.storeinfo.detail.hours.sirenorderhours.sirenorder,
                                    sun: args.createData.storeinfo.detail.hours.sirenorderhours.sirenorder,
                                } as WeeklyHours,
                                description: args.createData.storeinfo.detail.description ?? "없음",
                                parkinginfo: args.createData.storeinfo.detail.parkinginfo ?? "없음",
                                waytocome: args.createData.storeinfo.detail.waytocome ?? "없음",
                                phonenumber: args.createData.storeinfo.detail.phonenumber,
                            }
                        },
                        wallet: {
                            create: {
                                uuid: args.uuids.wallet
                            }
                        }
                    }
                }
            }
        })
        .catch(err => {
            Logger.error("데이터를 등록하는데 실패했습니다.", err.toString(), MerchantRepository.name)
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
        if(!e) throw ERROR.NotFoundData
        return {
            pass: e.pass,
            salt: e.salt,
            store: e.store as StoreEntity,
        } as MerchantEntity
    }

    parsingSalesEntity(e) : SalesEntity {
        if(!e) throw ERROR.NotFoundData
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