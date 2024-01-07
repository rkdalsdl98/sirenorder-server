import { Injectable, Logger } from "@nestjs/common";
import { IRepository } from "src/common/interface/irepository";
import { Category, MenuEntity } from "./menu.entity";
import { PrismaService } from "src/services/prisma.service";
import { ERROR } from "src/common/type/response.type";
import { MenuDetailEntity } from "./menudetail.entity";
import { NutritionsEntity } from "./nutritions.entity";
import { BottleSize } from "src/common/type/menu.type";

@Injectable()
export class MenuRepository implements IRepository<MenuEntity, MenuDetailEntity> {
     /**
     * 쿼리 실행 결과값을 순서대로 정렬되어 배열로 반환
     * @param querys
     * @returns [...query results]
     */
    async transaction(querys: []) {
        return await PrismaService.prisma.$transaction(querys)
        .catch(err => {
            Logger.error("트랙잭션중 오류가 발생했습니다.", err.toString(), MenuRepository)
            throw ERROR.ServerDatabaseError
        })
    }

    async getBy(args: {
        id?: number
    }): Promise<MenuDetailEntity> {
        return this.parsingMenuDetailEntity(await PrismaService.prisma.menudetail.findUnique({
            where: { id: args.id },
            include: { nutritions: true }
        }).catch(err => {
            Logger.error("데이터를 불러오는데 실패했습니다.", err.toString(), MenuRepository)
            throw ERROR.ServerDatabaseError
        }))
    }

    async getMany(category?: Category): Promise<MenuEntity[]> {
        return (await PrismaService.prisma.menu.findMany({
            where: { category },
            include: { detail: { select: { id: true }} 
        }})
        .catch(err => {
            Logger.error("데이터를 불러오는데 실패했습니다.", err.toString(), MenuRepository)
            throw ERROR.ServerDatabaseError
        })).map(e => this.parsingMenuEntity(e))
    }

    async getManyDetail(): Promise<MenuDetailEntity[]> {
        return (await PrismaService.prisma.menudetail.findMany({ include: { nutritions: true }})
        .catch(err => {
            Logger.error("데이터를 불러오는데 실패했습니다.", err.toString(), MenuRepository)
            throw ERROR.ServerDatabaseError
        })).map(e => this.parsingMenuDetailEntity(e))
    }

    parsingMenuEntity(e) : MenuEntity {
        if(!e) throw ERROR.NotFoundData
        return {
            id: e.id,
            category: e.category,
            name: e.name,
            price: e.price,
            en_name: e.en_name,
            thumbnail: e.thumbnail,
            detailId: e.detail.id,
        } as MenuEntity
    }

    parsingMenuDetailEntity(e) : MenuDetailEntity {
        if(!e) throw ERROR.NotFoundData
        return {
            id: e.id,
            description: e.description,
            allergys: e.allergys,
            nutritions: e.nutritions.map(n => ({ 
                size: n.size as BottleSize,
                volume: n.volume,
                calorie:`${n.calorie}kcal`,
                carbohydrate: `${n.carbohydrate}g`,
                sugars: `${n.sugars}g`,
                salt: `${n.salt}mg`,
                protein: `${n.protein}g`,
                fat: `${n.fat}g`,
                cholesterol: `${n.cholesterol}mg`,
                transfat: `${n.transfat}g`,
                saturatedfat: `${n.saturatedfat}g`,
                caffeine: `${n.caffeine}mg`,
            } as NutritionsEntity))
        } as MenuDetailEntity
    }
}