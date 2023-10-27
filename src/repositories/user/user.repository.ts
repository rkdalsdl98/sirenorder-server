import { Injectable, Logger } from "@nestjs/common";
import { IRepository } from "../../common/interface/irepository";
import { PrismaService } from "../../services/prisma.service";
import { OrderHistory, UserEntity } from "./user.entity";
import { MenuInfo } from "../../common/type/order.typs";
import { ERROR } from "../../common/type/response.type";

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
        .catch(err => {
            Logger.error("트랙잭션중 오류가 발생했습니다.", err.toString(), UserRepository)
            throw ERROR.ServerDatabaseError
        })
    }

    async getMany(): Promise<UserEntity[]> {
        return (await this.prisma.user.findMany({
            include: {
                wallet: true,
                gifts: true,
                order: true,
            }
        })
        .catch(err => {
            Logger.error("데이터를 불러오는데 실패했습니다.", err.toString(), UserRepository)
            throw ERROR.ServerDatabaseError
        })).map(e => this.parsingEntity(e))
    }

    async getBy(email: string): Promise<UserEntity> {
        return this.parsingEntity(await this.prisma.user.findUnique({ where: { email } })
        .catch(err => {
            Logger.error("데이터를 불러오는데 실패했습니다.", err.toString(), UserRepository)
            throw ERROR.ServerDatabaseError
        }))
    }

    async create(args: { 
        salt: string, 
        hash: string, 
        nickname: string, 
        email: string,
        uuid: string,
     }): Promise<UserEntity> {
        return this.parsingEntity(await this.prisma.user.create({
            data: {
                uuid: args.uuid,
                email: args.email,
                nickname: args.nickname,
                pass: args.hash,
                salt: args.salt,
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
    async updateBy(updateData: Omit<
        UserEntity,
        | "uuid"
        | "email"
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
                nickname: updateData.nickname,
                wallet: {
                    update: {
                        point: updateData.wallet?.point,
                        stars: updateData.wallet?.stars,
                    }
                }
            }
        })
        .catch(err => {
            Logger.error("데이터를 갱신하는데 실패했습니다.", err.toString(), UserRepository)
            throw ERROR.ServerDatabaseError
        }))
    }

    async deleteBy(email: string): Promise<boolean> {
        return !!(await this.prisma.user.delete({ where: { email } })
        .catch(err => {
            Logger.error("데이터를 삭제하는데 실패했습니다.", err.toString(), UserRepository)
            throw ERROR.ServerDatabaseError
        }))
    }

    parsingEntity(e) : UserEntity {
        return {
            uuid: e.uuid,
            email: e.email,
            nickname: e.nickname,
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
            token: e.token === undefined ? null : e.token as { accesstoken: string;refreshtoken: string },
            createdAt: e.createdAt,
            updatedAt: e.updatedAt
        }
    }
}