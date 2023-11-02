import { TypedParam, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { ERROR, TryCatch } from "../common/type/response.type";
import { StoreDetailDto, StoreDto } from "../dto/store.dto";
import { StoreService } from "../services/store.service";

@Controller('store')
export class StoreController {
    constructor(
        private readonly storeService: StoreService
    ){}

    @TypedRoute.Get()
    async getStoreList() : Promise<TryCatch<
    StoreDto[],
    | typeof ERROR.ServerDatabaseError
    >> {
        try {
            const result = await this.storeService.getStores()
            return {
                data: result,
                status: 200,
            }
        } catch(e) { return e }
    }

    @TypedRoute.Get("/:id")
    async getStoreDetail(
        @TypedParam("id") id: number
    ) : Promise<TryCatch<
    StoreDetailDto,
    | typeof ERROR.ServerDatabaseError
    >> {
        try {
            const result = await this.storeService.getStoreDetailBy(id)
            return {
                data: result,
                status: 200,
            }
        } catch(e) { return e }
    }
}