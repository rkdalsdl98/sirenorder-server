import { TypedParam, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { ERROR, TryCatch } from "src/common/type/response.type";
import { MenuDto } from "src/dto/menu.dto";
import { MenuDetailDto } from "src/dto/menudetail.dto";
import { MenuService } from "src/services/menu.service";

@Controller('menu')
export class MenuController {
    constructor(
        private readonly meunService: MenuService
    ){}

    @TypedRoute.Get()
    async getMenus() : Promise<TryCatch<
    MenuDto[],
    | typeof ERROR.ServerDatabaseError
    >> {
        try {
            const result = await this.meunService.getMenus()
            return {
                data: result,
                status: 200,
            }
        } catch(e) { return e }
    }

    @TypedRoute.Get('/:id')
    async getMenuDetail(
        @TypedParam("id") id: number
    ) : Promise<TryCatch<
    MenuDetailDto,
    | typeof ERROR.ServerDatabaseError
    >> {
        try {
            const result = await this.meunService.getMenuDetail(id)
            return {
                data: result,
                status: 200,
            }
        } catch(e) { return e }
    }
}