import { TypedParam, TypedQuery, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ERROR, TryCatch } from "src/common/type/response.type";
import { MenuDto } from "src/dto/menu.dto";
import { MenuDetailDto } from "src/dto/menudetail.dto";
import { MenuQuery } from "src/query/menu.query";
import { MenuService } from "src/services/menu.service";

@Controller('menu')
@ApiTags("메뉴")
export class MenuController {
    constructor(
        private readonly meunService: MenuService
    ){}

    @TypedRoute.Get()
    async getMenus(
        @TypedQuery() query: MenuQuery.MenuQueryGetListOptions,
    ) : Promise<TryCatch<
    MenuDto[],
    | typeof ERROR.ServerDatabaseError
    >> {
        try {
            const result = await this.meunService.getMenus(query.category)
            return {
                data: result,
                status: 200,
            }
        } catch(e) { return e }
    }

    @TypedRoute.Get('detail')
    async getMenuDetail(
        @TypedQuery() query: MenuQuery.MenuQueryGetDetailOptions
    ) : Promise<TryCatch<
    MenuDetailDto,
    | typeof ERROR.ServerDatabaseError
    >> {
        try {
            const result = await this.meunService.getMenuDetail(query.detailId)
            return {
                data: result,
                status: 200,
            }
        } catch(e) { return e }
    }
}