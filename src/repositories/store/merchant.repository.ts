import { Injectable, Logger } from "@nestjs/common";
import { IRepository } from "../../common/interface/irepository";
import { MerchantEntity } from "./merchant.entity";
import { PrismaService } from "../../services/prisma.service";
import { StoreEntity } from "./store.entity";
import { ERROR } from "../../common/type/response.type";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { SalesEntity } from "./sales.entity";
import { StoreDetailEntity, WeeklyHours } from "./storedetail.entity";
import { MerchantDto } from "src/dto/merchant.dto";

@Injectable()
export class MerchantRepository implements IRepository<MerchantEntity, undefined> {
    constructor(
        private readonly prisma: PrismaService,
    ){}

    async getMany(): Promise<MerchantEntity[]> {
        return (await this.prisma.merchant.findMany({
            include: { 
                store: {
                    include: { 
                        detail: true, 
                        wallet: {
                            include: { sales: true }
                        } 
                    }
                },
            }
        }))
        .map(m => this.parsingEntity(m))
    }

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
                        wallet: { include: { sales: true }},
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
                        address: args.createData.storeinfo.address,
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
                                    mon: args.createData.storeinfo.detail.openhours,
                                    tue: args.createData.storeinfo.detail.openhours,
                                    thur: args.createData.storeinfo.detail.openhours,
                                    wed: args.createData.storeinfo.detail.openhours,
                                    fri: args.createData.storeinfo.detail.openhours,
                                    sat: args.createData.storeinfo.detail.openhours,
                                    sun: args.createData.storeinfo.detail.openhours,
                                } as WeeklyHours,
                                sirenorderhours: {
                                    mon: args.createData.storeinfo.detail.sirenorderhours,
                                    tue: args.createData.storeinfo.detail.sirenorderhours,
                                    thur: args.createData.storeinfo.detail.sirenorderhours,
                                    wed: args.createData.storeinfo.detail.sirenorderhours,
                                    fri: args.createData.storeinfo.detail.sirenorderhours,
                                    sat: args.createData.storeinfo.detail.sirenorderhours,
                                    sun: args.createData.storeinfo.detail.sirenorderhours,
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
        walletUUID: string,
    }) :
    Promise<SalesEntity> {
        return this.parsingSalesEntity(await this.prisma.sales.upsert({
            where: { id: args.salesId },
            update: {
                amounts: updateDate.amounts,
                menus: updateDate.menus,
                salesdate: updateDate.salesdate,
            },
            create: {
                amounts: updateDate.amounts,
                menus: updateDate.menus,
                salesdate: updateDate.salesdate!,
                currwallet: {
                    connect: { uuid: args.walletUUID }
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

    async deleteBy(args: {
        uuid: string
    }): Promise<boolean> {
        return !!(await this.prisma.merchant.delete({
            where: { uuid: args.uuid }
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
            menus: e.menus,
            salesdate: e.salesdate,
        } as SalesEntity
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
}