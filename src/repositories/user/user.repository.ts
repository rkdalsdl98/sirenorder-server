import { Injectable } from "@nestjs/common";
import { IRepository } from "src/common/interface/irepository";
import { PrismaService } from "src/services/prisma.service";
import { OrderHistory, UserEntity } from "./user.entity";
import { MenuInfo } from "src/common/type/order.typs";
import { GiftEntity } from "./gift.entity";

@Injectable()
export class UserRepository implements IRepository<UserEntity> {
    constructor(
        private readonly prisma: PrismaService
    ){}

    /**
     * 쿼리 실행 결과값을 순서대로 정렬되어 배열로 반환
     * @param querys
     * @returns [...query results]
     */
    async transaction(querys: []) : Promise<[]> {
        return await this.prisma.$transaction(querys)
    }

    async getMany(): Promise<UserEntity[]> {
        return (await this.prisma.user.findMany({
            include: {
                wallet: true,
                gifts: true,
                order: true,
            }
        })).map(e => this.parsingEntity(e))
    }

    async getBy(email: string): Promise<UserEntity> {
        return this.parsingEntity(await this.prisma.user.findUnique({ where: { email } }))
    }

    /**
     * uuid는 외부에서 발급
     * @param updateData 
     * @param email 
     * @returns updated user data
     */
    async updateBy(updateData: Omit<
        UserEntity,
        | "uuid"
        | "pass"
        | "salt"
        | "order"
        | "gifts"
        | "createdAt"
        | "updatedAt"
        >, email: string): Promise<UserEntity> {
        return this.parsingEntity(await this.prisma.user.update({
            where: { email },
            data: {
                email: updateData.email,
                wallet: {
                    update: {
                        point: updateData.wallet?.point,
                        stars: updateData.wallet?.stars,
                    }
                }
            }
        }))
    }

    async deleteBy(email: string): Promise<boolean> {
        return !!(await this.prisma.user.delete({ where: { email } }))
    }

    parsingEntity(e) : UserEntity {
        return {
            uuid: e.uuid,
            email: e.email,
            pass: e.pass,
            salt: e.salt,
            wallet: e.wallet,
            gifts: e.gifts,
            coupons: e.coupons,
            order: e.order === undefined ? null : e.order.order,
            orderhistory: Object.keys(e.orderhistory).map(key => {
                return {
                    saleprice: e.orderhistory[key]["saleprice"],
                    totalprice: e.orderhistory[key]["totalprice"],
                    menuinfo: e.orderhistory[key]["menuinfo"] as MenuInfo,
                    merchant_uid: e.orderhistory[key]["merchant_uid"]
                } as OrderHistory
            }),
            token: e.token as { accesstoken: string, refreshtoken: string },
            createdAt: e.createdAt,
            updatedAt: e.updatedAt
        }
    }
}