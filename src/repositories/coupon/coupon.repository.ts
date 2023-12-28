import { Injectable, Logger } from "@nestjs/common";
import { IRepository } from "src/common/interface/irepository";
import { CouponEntity, SimpleCouponEntity } from "./coupon.entity";
import { PrismaService } from "src/services/prisma.service";
import { ERROR } from "src/common/type/response.type";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { Prisma } from "@prisma/client";
import { GiftInfo } from "src/common/type/gift.type";

@Injectable()
export class CouponRepository implements IRepository<CouponEntity, unknown> {
    constructor(
        private readonly prisma: PrismaService,
    ){}
    
    async deleteExpiredCoupon()
    : Promise<void> {
        await this.prisma.coupon.deleteMany({
            where: {
                AND: {
                    expirationperiod: {
                        lt: new Date(Date.now())
                    }
                }
            }
        })
        .then(_=> Logger.log("쿠폰정보 초기화"))
        .catch(err => {
            Logger.error("쿠폰정보 초기화중 오류가 발생했습니다.", CouponRepository.name)
            throw ERROR.ServerDatabaseError
        })
    }

    async getMany(): Promise<CouponEntity[]> {
        return (await this.prisma.coupon.findMany())
        .map(c => this.parsingEntity(c))
    }

    async getBy(code: string ): Promise<CouponEntity> {
        return this.parsingEntity(await this.prisma.coupon.findUnique({
            where: { code }
        })
        .catch(err => {
            if(err instanceof PrismaClientKnownRequestError) {
                switch(err.code) {
                    case "P2025":
                        throw ERROR.NotFoundData
                }
            }
            Logger.error("쿠폰조회에 실패했습니다.", CouponRepository.name)
            throw ERROR.ServerDatabaseError
        }))
    }

    async publishCoupon(args: {
        coupon: CouponEntity,
    }) : Promise<boolean> {
        return !!(await this.prisma.coupon.create({
            data: {
                code: args.coupon.code,
                expirationperiod: args.coupon.expiration_period,
                menuinfo: args.coupon.menuinfo,
            },
        })
        .catch(err => {
            Logger.error("쿠폰등록에 실패했습니다.", CouponRepository.name)
            throw ERROR.ServerDatabaseError
        }))
    }

    async registerCoupon(args: {
        current_user_email: string,
        coupon: SimpleCouponEntity,
    }) : Promise<boolean> {
        return !!(await this.prisma.user.update({
            where: { email: args.current_user_email },
            data: {
                coupons: {
                    push: { ...args.coupon } as Prisma.InputJsonValue
                }
            }
        }).catch(err => {
            Logger.error("사용자의 쿠폰정보 업데이트를 실패했습니다.", CouponRepository.name)
            throw ERROR.ServerDatabaseError
        }))
    }

    async updateGift(args: {
        uuid: string,
        gift: GiftInfo,
        coupon: SimpleCouponEntity,
    }) : Promise<void> {
        await this.prisma.user.update({
            where: { email: args.gift.to },
            data: {
                gifts: {
                    create: {
                        coupon: { ...args.coupon },
                        from: args.gift.from,
                        to: args.gift.to,
                        message: args.gift.message,
                        wrappingtype: args.gift.wrappingtype,
                        uuid: args.uuid,
                        menu: args.gift.menu,
                        imp_uid: args.gift.imp_uid,
                        order_uid: args.gift.order_uid,
                    }
                }
            }
        })
        .catch(err => {
            if(err instanceof PrismaClientKnownRequestError) {
                switch(err.code) {
                    case "P2025":
                        throw ERROR.NotFoundData
                }
            }
            Logger.error("선물정보 업데이트중 오류가 발생했습니다.", CouponRepository.name)
            throw ERROR.ServerDatabaseError
        })
    }

    async deleteGiftCoupon(
        current_user_email: string,
        encryption_code: string,
        gift_uid: string,
    ) {
        return await this.prisma.$transaction(async tx => {
            const deleteCoupon = await tx.coupon
            .delete({ where: { code: encryption_code } })
            .catch(err => {
                if(err instanceof PrismaClientKnownRequestError) {
                    switch(err.code) {
                        case "P2025":
                            throw ERROR.NotFoundData
                    }
                }
                Logger.error("쿠폰삭제에 실패했습니다.", CouponRepository.name)
                throw ERROR.ServerDatabaseError
            })

            await tx.user.update({
                where: { email: current_user_email },
                data: {
                    gifts: { 
                        update: {
                            where: { uuid : gift_uid },
                            data: { used: true },
                        }
                    }
                }
            })
            .catch(err => {
                if(err instanceof PrismaClientKnownRequestError) {
                    switch(err.code) {
                        case "P2025":
                            throw ERROR.NotFoundData
                    }
                }
                Logger.error("사용자의 쿠폰폐기를 싪패했습니다.", CouponRepository.name)
                throw ERROR.ServerDatabaseError
            })

            return this.parsingEntity(deleteCoupon)
        })
    }

    async deleteCoupon(
        current_user_email: string, 
        code: string,
        encryption_code: string,
    )
    : Promise<CouponEntity> {
        return await this.prisma.$transaction(async tx => {
            const deleteCoupon = await tx.coupon
            .delete({ where: { code: encryption_code } })
            .catch(err => {
                if(err instanceof PrismaClientKnownRequestError) {
                    switch(err.code) {
                        case "P2025":
                            throw ERROR.NotFoundData
                    }
                }
                Logger.error("쿠폰삭제에 실패했습니다.", CouponRepository.name)
                throw ERROR.ServerDatabaseError
            })

            const findOwner = await tx.user.findFirst({
                where: { email: current_user_email }
            })

            if(findOwner) {
                const coupons = findOwner.coupons.filter(v => {
                    return this.parsingSimpleEntity(v).code !== code
                }) as Prisma.InputJsonValue[]
                await tx.user.update({
                    where: { email: findOwner.email },
                    data: { coupons }
                })
                .catch(err => {
                    Logger.error("사용자의 쿠폰폐기를 싪패했습니다.", CouponRepository.name)
                    throw ERROR.ServerDatabaseError
                })
            }
            
            return this.parsingEntity(deleteCoupon)
        })
        .catch(err => {
            Logger.error("트랜잭션 수행중 오류가 발생했습니다.", CouponRepository.name)
            throw err
        })
    }

    parsingSimpleEntity(e) {
        if(!e) throw ERROR.NotFoundData

        return {
            code: e.code,
            expiration_period: e.expirationperiod,
            menu_name: e.menu_name,
            thumbnail: e.thumbnail,
        } as SimpleCouponEntity
    }

    parsingEntity(e) {
        if(!e) throw ERROR.NotFoundData

        return {
            code: e.code,
            expiration_period: e.expirationperiod,
            menuinfo: e.menuinfo,
        } as CouponEntity
    }
}