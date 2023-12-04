import { Injectable, Logger } from "@nestjs/common";
import { IRepository } from "src/common/interface/irepository";
import { CouponEntity, SimpleCouponEntity } from "./coupon.entity";
import { PrismaService } from "src/services/prisma.service";
import { ERROR } from "src/common/type/response.type";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { Prisma } from "@prisma/client";

@Injectable()
export class CouponRepository implements IRepository<CouponEntity, unknown> {
    constructor(
        private readonly prisma: PrismaService,
    ){}

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
            Logger.error("쿠폰조회에 실패했습니다.")
            throw ERROR.ServerDatabaseError
        }))
    }

    async publishCoupon(args: {
        current_user_email: string, 
        coupon: CouponEntity
    }) {
        return await this.prisma.$transaction(async tx => {
            const coupon = this.parsingEntity(await tx.coupon.create({
                data: {
                    code: args.coupon.code,
                    expirationperiod: args.coupon.expiration_period,
                    menuinfo: args.coupon.menuinfo,
                },
            })
            .catch(err => {
                Logger.error("쿠폰등록에 실패했습니다.")
                throw ERROR.ServerDatabaseError
            }))

            await tx.user.update({
                where: { email: args.current_user_email },
                data: {
                    coupons: {
                        push: {
                            code: coupon.code,
                            expiration_period: args.coupon.expiration_period,
                            menu_name: coupon.menuinfo.name,
                            thumbnail: coupon.menuinfo.thumbnail,
                        }
                    }
                }
            })
            .catch(err => {
                Logger.error("사용자의 쿠폰정보 업데이트를 실패했습니다.")
                throw ERROR.ServerDatabaseError
            })

            return coupon
        })
    }

    async deleteCoupon(current_user_email: string, code: string)
    : Promise<boolean> {
        return await this.prisma.$transaction(async tx => {
            const deleteCoupon = await tx.coupon
            .delete({ where: { code } })
            .catch(err => {
                Logger.error("쿠폰삭제에 실패했습니다.")
                throw ERROR.ServerDatabaseError
            })
            if(!deleteCoupon) return false
            
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
                    Logger.error("사용자의 쿠폰폐기를 싪패했습니다.")
                    throw ERROR.ServerDatabaseError
                })
            }
            
            return true
        })
        .catch(err => {
            if(err instanceof PrismaClientKnownRequestError) {
                switch(err.code) {
                    case "P2025":
                        throw ERROR.NotFoundData
                }
            }
            Logger.error("트랜잭션 수행중 오류가 발생했습니다.")
            throw err
        })
    }

    parsingSimpleEntity(e) {
        if(!e) throw ERROR.Accepted

        return {
            code: e.code,
            expiration_period: e.expirationperiod,
            menu_name: e.menu_name,
            thumbnail: e.thumbnail,
        } as SimpleCouponEntity
    }

    parsingEntity(e) {
        if(!e) throw ERROR.Accepted

        return {
            code: e.code,
            expiration_period: e.expirationperiod,
            menuinfo: e.menuinfo,
        } as CouponEntity
    }
}