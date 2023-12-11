import { Injectable, Logger } from "@nestjs/common";
import { IRepository } from "../../common/interface/irepository";
import { PrismaService } from "../../services/prisma.service";
import { OrderHistory, UserEntity } from "./user.entity";
import { MenuInfo } from "../../common/type/order.type";
import { ERROR } from "../../common/type/response.type";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { WalletEntity } from "./wallet.entity";
import { GiftEntity } from "./gift.entity";
import { SimpleCouponEntity } from "../coupon/coupon.entity";

@Injectable()
export class UserRepository implements IRepository<UserEntity, undefined> {
    constructor(
        private readonly prisma: PrismaService
    ){}
    
    async test() {
        await this.prisma.user.update({
            where: { email: "rkdalsdl112@gmail.com" },
            data: {
                gifts: {
                    deleteMany: {}
                }
            }
        })
    }

    async getMany(): Promise<UserEntity[]> {
        return (await this.prisma.user.findMany({
            include: {
                wallet: {
                    select: {
                        point: true,
                        stars: true,
                        uuid: true,
                    }
                },
                gifts: true,
            }
        })
        .catch(err => {
            Logger.error("데이터를 불러오는데 실패했습니다.", err.toString(), UserRepository)
            throw ERROR.ServerDatabaseError
        })).map(e => this.parsingEntity(e))
    }

    async getBy(args: {
        email?: string,
    }): Promise<UserEntity> {
        return this.parsingEntity(await this.prisma.user.findUnique({ 
            where: { 
                email: args.email,
            },
            include: {
                wallet: {
                    select: {
                        point: true,
                        stars: true,
                        uuid: true,
                    }
                },
                gifts: true,
            }
        })
        .catch(err => {
            if(err instanceof PrismaClientKnownRequestError) {
                switch(err.code) {
                    case "P2025":
                        throw ERROR.NotFoundData
                }
            }
            Logger.error("데이터를 불러오는데 실패했습니다.", err.toString(), UserRepository)
            throw ERROR.ServerDatabaseError
        }))
    }

    async getOrderHistory(email: string)
    : Promise<OrderHistory[]> {
        const result = await this.prisma.user.findFirst({
            where: { email },
            select: {
                orderhistory: true,
            }
        })
        if(!result) {
            throw ERROR.NotFoundData
        }

        return result
        .orderhistory
        .map(h => this.parsingHistoryEntity(h))
    }
    
    async create(args: { 
        salt: string, 
        hash: string, 
        nickname: string, 
        email: string,
        uuid: string,
        wallet_uid: string,
     }): Promise<UserEntity> {
        return this.parsingEntity(await this.prisma.user.create({
            data: {
                uuid: args.uuid,
                email: args.email,
                nickname: args.nickname,
                pass: args.hash,
                salt: args.salt,
                wallet: {
                    create: { uuid: args.wallet_uid }
                }
            },
            include: {
                wallet: true,
                gifts: true,
            }
        })
        .catch(err => {
            Logger.error("데이터를 저장하는데 실패했습니다.", err.toString(), UserRepository)
            throw ERROR.ServerDatabaseError
        }))
    }

    /**
     * uuid는 외부에서 발급
     * @param updateData 
     * @param email 
     * @returns updated user data
     */
    async updateBy(
        updateData: Partial<UserEntity>, 
        email: string
    ): Promise<UserEntity> {
        return this.parsingEntity(await this.prisma.user.update({
            where: { email },
            data: {
                nickname: updateData.nickname,
                accesstoken: updateData.accesstoken,
                refreshtoken: updateData.refreshtoken,
                wallet: {
                    update: {
                        point: updateData.wallet?.point,
                        stars: updateData.wallet?.stars,
                    }
                }
            },
            include: {
                wallet: true,
                gifts: true,
            }
        })
        .catch(err => {
            if(err instanceof PrismaClientKnownRequestError) {
                switch(err.code) {
                    case "P2025":
                        throw ERROR.NotFoundData
                }
            }
            Logger.error("데이터를 갱신하는데 실패했습니다.", err.toString(), UserRepository)
            throw ERROR.ServerDatabaseError
        }))
    }

    async deleteBy(email: string): Promise<boolean> {
        return !!(await this.prisma.user.delete({ where: { email } })
        .catch(err => {
            if(err instanceof PrismaClientKnownRequestError) {
                switch(err.code) {
                    case "P2025":
                        throw ERROR.NotFoundData
                }
            }
            Logger.error("데이터를 삭제하는데 실패했습니다.", err.toString(), UserRepository)
            throw ERROR.ServerDatabaseError
        }))
    }

    parsingHistoryEntity(e) {
        if(!e) throw ERROR.NotFoundData
        return {
            imp_uid: e.imp_uid,
            menus: e.menus,
            saleprice: e.saleprice,
            store_name: e.store_name,
            store_uid: e.store_uid,
            store_thumbnail: e.store_thumbnail,
            totalprice: e.totalprice,
        } as OrderHistory
    }

    parsingEntity(e) : UserEntity {
        if(!e) throw ERROR.NotFoundData
        return {
            uuid: e.uuid,
            tel: e.tel,
            email: e.email,
            nickname: e.nickname,
            pass: e.pass,
            salt: e.salt,
            wallet: e.wallet as Omit<WalletEntity, "user_uid">,
            gifts: e.gifts.map(g => ({
                ...g,
                coupon: {
                    code: g.coupon.code,
                    expiration_period: new Date(g.coupon.expiration_period),
                    menu_name: g.coupon.menu_name,
                    thumbnail: g.coupon.thumbnail,
                } as SimpleCouponEntity,
            } as GiftEntity)),
            coupons: e.coupons.map(c => ({
                code: c.code,
                expiration_period: new Date(c.expiration_period),
                menu_name: c.menu_name,
                thumbnail: c.thumbnail,
            } as SimpleCouponEntity)),
            orderhistory: Object.keys(e.orderhistory).map(key => {
                return {
                    imp_uid: e.orderhistory[key]["imp_uid"],
                    saleprice: e.orderhistory[key]["saleprice"],
                    totalprice: e.orderhistory[key]["totalprice"],
                    menus: e.orderhistory[key]["menus"].map(m => m as MenuInfo),
                    store_uid: e.orderhistory[key]["store_uid"],
                    store_name: e.orderhistory[key]["store_name"],
                    store_thumbnail: e.orderhistory[key]["store_thumbnail"],
                } as OrderHistory
            }),
            accesstoken: e.accesstoken,
            refreshtoken: e.refreshtoken,
            createdAt: e.createdAt,
            updatedAt: e.updatedAt
        }
    }
}