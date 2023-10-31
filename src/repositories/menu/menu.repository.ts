import { Injectable, Logger } from "@nestjs/common";
import { IRepository } from "src/common/interface/irepository";
import { MenuEntity } from "./menu.entity";
import { PrismaService } from "src/services/prisma.service";
import { ERROR } from "src/common/type/response.type";
import { MenuDetailEntity } from "./menudetail.entity";
import { NutritionsEntity } from "./nutritions.entity";
import { BottleSize } from "src/common/type/menu.type";

@Injectable()
export class MenuRepository implements IRepository<MenuEntity, MenuDetailEntity> {
    constructor(
        private readonly prisma: PrismaService
    ){}

    /**
     * 쿼리 실행 결과값을 순서대로 정렬되어 배열로 반환
     * @param querys
     * @returns [...query results]
     */
    async transaction(querys: []) {
        return await this.prisma.$transaction(querys)
        .catch(err => {
            Logger.error("트랙잭션중 오류가 발생했습니다.", err.toString(), MenuRepository)
            throw ERROR.ServerDatabaseError
        })
    }

    async getBy(args: {
        id?: number
    }): Promise<MenuDetailEntity> {
        return this.parsingMenuDetailEntity(await this.prisma.menudetail.findUnique({
            where: { id: args.id },
            include: { nutritions: true }
        }).catch(err => {
            Logger.error("데이터를 불러오는데 실패했습니다.", err.toString(), MenuRepository)
            throw ERROR.ServerDatabaseError
        }))
    }

    async getMany(): Promise<MenuEntity[]> {
        return (await this.prisma.menu.findMany({ include: { detail: { select: { id: true }} }})
        .catch(err => {
            Logger.error("데이터를 불러오는데 실패했습니다.", err.toString(), MenuRepository)
            throw ERROR.ServerDatabaseError
        })).map(e => this.parsingMenuEntity(e))
    }

    async getManyDetail(): Promise<MenuDetailEntity[]> {
        return (await this.prisma.menudetail.findMany({ include: { nutritions: true }})
        .catch(err => {
            Logger.error("데이터를 불러오는데 실패했습니다.", err.toString(), MenuRepository)
            throw ERROR.ServerDatabaseError
        })).map(e => this.parsingMenuDetailEntity(e))
    }

    parsingMenuEntity(e) : MenuEntity {
        return {
            id: e.id,
            name: e.name,
            en_name: e.en_name,
            price: e.price,
            thumbnail: e.thumbnail,
            detailId: e.detail.id,
        } as MenuEntity
    }

    parsingMenuDetailEntity(e) : MenuDetailEntity {
        return {
            id: e.id,
            description: e.description,
            allergys: e.allergys,
            nutritions: e.nutritions.map(n => ({ 
                size: n.size as BottleSize,
                calorie: n.calorie.toString(),
                carbohydrate: n.carbohydrate.toString(),
                sugars: n.sugars.toString(),
                salt: n.salt.toString(),
                protein: n.protein.toString(),
                fat: n.fat.toString(),
                cholesterol: n.cholesterol.toString(),
                transfat: n.transfat.toString(),
                saturatedfat: n.saturatedfat.toString(),
                caffeine: n.caffeine.toString(),
            } as NutritionsEntity))
        } as MenuDetailEntity
    }
}