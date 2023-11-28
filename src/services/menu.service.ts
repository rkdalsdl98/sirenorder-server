import { Injectable, Logger } from "@nestjs/common";
import { MenuRepository } from "src/repositories/menu/menu.repository";
import { RedisService } from "./redis.service";
import { Category, MenuEntity } from "src/repositories/menu/menu.entity";
import { MenuDto } from "src/dto/menu.dto";
import { MenuDetailDto } from "src/dto/menudetail.dto";
import { MenuDetailEntity } from "src/repositories/menu/menudetail.entity";

@Injectable()
export class MenuService {
    constructor(
        private readonly menuRepository: MenuRepository,
        private readonly redis: RedisService,
    ){
        this._initialized()
    }

    private async _initialized() :
    Promise<void> {
        const menus = await this.menuRepository.getMany()
        const details = await this.menuRepository.getManyDetail()

        await this.redis.set("menus", menus, MenuService.name)
        .then(_=> Logger.log("메뉴정보 인 메모리 캐싱"))
        .catch(err => {
            Logger.error("메뉴정보 인 메모리 캐싱실패")
            throw err
        })
        await this.redis.set("menudetails", details, MenuService.name)
        .then(_=> Logger.log("메뉴 상세정보 인 메모리 캐싱"))
        .catch(err => {
            Logger.error("메뉴 상세정보 인 메모리 캐싱실패")
            throw err
        })
    }

    async getMenus(category?: Category) :
    Promise<MenuDto[]> {
        return await this._findMenu(category)
    }

    async getMenuDetail(id: number) :
    Promise<MenuDetailDto> {
        return await this._findMenuDetail(id)
    }

    /**
     * 메뉴 상세정보 조회
     * 
     * 캐시된 데이터가 있다면 캐시 데이터를 반환
     * @param email 
     * @returns MenuDetail
     */
    private async _findMenuDetail(id: number) :
    Promise<MenuDetailDto> {
        const cache = (await this.redis.get<MenuDetailEntity[]>("menudetails", MenuService.name)
        .catch(err => {
            Logger.error("캐시로드오류")
            throw err
        }))?.find(c => c.id === id)

        if(cache !== null) return { ...cache } as MenuDetailDto
        return (await this.menuRepository.getBy({ id })
        .then(d => ({ ...d } as MenuDetailDto))
        .catch(err => {
            Logger.error("메뉴정보 조회 실패", err) 
            throw err
        }))
    }

    /**
     * 메뉴 리스트 조회
     * 
     * 캐시된 데이터가 있다면 캐시 데이터를 반환
     * @param email 
     * @returns Menu
     */
    private async _findMenu(category?: Category) :
    Promise<MenuDto[]> {
        const caches = (await this.redis.get<MenuEntity[]>("menus", MenuService.name)
        .catch(err => {
            Logger.error("캐시로드오류")
            throw err
        }))

        if(caches !== null) return caches.filter(c => {
            return category !== undefined ? (c.category === category) : true
        })
        return (await this.menuRepository.getMany(category)
        .catch(err => {
            Logger.error("메뉴 리스트 조회 실패", err) 
            throw err
        })).map(m => ({ ...m } as MenuDto))
    }
}