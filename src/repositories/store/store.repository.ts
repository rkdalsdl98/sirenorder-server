import { Injectable, Logger } from "@nestjs/common";
import { IRepository } from "../../common/interface/irepository";
import { PrismaService } from "../../services/prisma.service";
import { LatLng, StoreEntity } from "./store.entity";
import { ERROR } from "../../common/type/response.type";
import { StoreDetailEntity, WeeklyHours } from "./storedetail.entity";
import { OrderEntity } from "../user/order.entity";
import { MenuInfo } from "src/common/type/order.type";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { OrderHistory } from "../user/user.entity";

@Injectable()
export class StoreRepository implements IRepository<StoreEntity, StoreDetailEntity>  {
    async getBy(id: number): Promise<StoreDetailEntity> {
        return this.parsingDetailEntity(await PrismaService.prisma.storedetail.findUnique({ 
            where: { id }
        }).catch(err => {
            Logger.error("데이터를 불러오는데 실패했습니다.", err.toString(), StoreRepository)
            throw ERROR.ServerDatabaseError
        }))
    }

    async getOrders(storeId: string): Promise<OrderEntity[]> {
        return (await PrismaService.prisma.order.findMany({
            where: { store_uid: storeId }
        }).catch(err => {
            Logger.error("데이터를 불러오는데 실패했습니다.", err.toString(), StoreRepository)
            throw ERROR.ServerDatabaseError
        })).map(o => this.parsingOrderEntity(o))
    }

    async addOrderHistory(buyer_email: string, history: OrderHistory)
    : Promise<boolean> {
        return !!(await PrismaService.prisma.user.update({
            where: { email: buyer_email },
            data: {
                orderhistory: {
                    push: { ...history }
                }
            }
        }).catch(err => {
            Logger.error("주문내역 업데이트에 실패했습니다.")
            throw ERROR.ServerDatabaseError
        }))
    }

    async getMany(): Promise<StoreEntity[]> {
        return (await PrismaService.prisma.store.findMany({ 
            include: { detail: { select: { id: true }} }
        }).catch(err => {
            Logger.error("데이터를 불러오는데 실패했습니다.", err.toString(), StoreRepository)
            throw ERROR.ServerDatabaseError
        })).map(e => this.parsingEntity(e))
    }

    async createOrder(order: OrderEntity, sales_uid: string)
    : Promise<OrderEntity> {
        return await PrismaService.prisma.$transaction<OrderEntity>(async tx => {
            const createdOrder = this.parsingOrderEntity(await tx.order.create({
                data: { ...order}
            }).catch(err => {
                Logger.error("데이터를 갱신하는데 실패했습니다.", err.toString(), StoreRepository)
                throw ERROR.ServerDatabaseError
            }))
            await tx.store.update({
                where: { uuid: order.store_uid },
                data: {
                    wallet: {
                        update: {
                            data: {
                                point: { increment: createdOrder.totalprice },
                                sales: {
                                    create: {
                                        uuid: sales_uid,
                                        amounts: order.totalprice,
                                        menus: order.menus,
                                    }
                                },
                            }
                        }
                    }
                }
            }).catch(async storeError => {
                await tx.order.delete({
                    where: { uuid: order.uuid }
                })
                .catch(orderError => {
                    if(orderError instanceof PrismaClientKnownRequestError) {
                        switch(orderError.code) {
                            case "P2025":
                                Logger.error("주문정보를 찾을 수 없어 삭제에 실패했습니다.", orderError.toString(), StoreRepository)
                                break
                            default: 
                                Logger.error("데이터를 삭제하는데 실패했습니다.", orderError.toString(), StoreRepository)
                                break
                        }
                    }
                })
                
                if(storeError instanceof PrismaClientKnownRequestError) {
                    switch(storeError.code) {
                        case "P2025":
                            Logger.error("가게정보를 찾을 수 없어 주문내역 갱신을 실패했습니다.", storeError.toString(), StoreRepository)
                            throw ERROR.NotFoundData
                    }
                }
                Logger.error("가게 주문내역 갱신을 실패했습니다.", storeError.toString(), StoreRepository)
                throw ERROR.ServerDatabaseError
            })
            return createdOrder
        })
    }

    async deleteOrder(orderId: string, sales_uid: string): Promise<OrderEntity> {
        return await PrismaService.prisma.$transaction<OrderEntity>(async tx => {
            const deletedOrder = this.parsingOrderEntity(await tx.order.delete({
                where: { uuid: orderId }
            }).catch(err => {
                if(err instanceof PrismaClientKnownRequestError) {
                    switch(err.code) {
                        case "P2025":
                            throw ERROR.NotFoundData
                    }
                }
                Logger.error("데이터를 삭제하는데 실패했습니다.", err.toString(), StoreRepository)
                throw ERROR.ServerDatabaseError
            }))
            await tx.store.update({
                where: { uuid: deletedOrder.store_uid },
                data: {
                    wallet: {
                        update: {
                            data: {
                                point: { decrement: deletedOrder.totalprice },
                                sales: {
                                    delete: { uuid: sales_uid }
                                },
                            },
                        }
                    }
                },
            }).catch(err => {
                if(err instanceof PrismaClientKnownRequestError) {
                    switch(err.code) {
                        case "P2025":
                            throw ERROR.NotFoundData
                    }
                }
                Logger.error("상점 정보를 갱신하는데 실패했습니다.", err.toString(), StoreRepository)
                throw ERROR.ServerDatabaseError
            })
            return deletedOrder
        })
    }

    async deleteOrders() : Promise<void> {
        await PrismaService.prisma.order.deleteMany()
    }

    parsingEntity(e) : StoreEntity {
        return {
            uuid: e.uuid,
            imp_uid: e.imp_uid,
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
            uuid: e.uuid,
            totalprice: e.totalprice,
            saleprice: e.saleprice,
            store_uid: e.store_uid,
            deliveryinfo: e.deliveryinfo,
            menus: e.menus.map(m => m as MenuInfo),
        } as OrderEntity
    }
}