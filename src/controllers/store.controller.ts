import { TypedParam, TypedQuery, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { ERROR, TryCatch } from "../common/type/response.type";
import { OrderDto, StoreDetailDto, StoreDto } from "../dto/store.dto";
import { StoreService } from "../services/store.service";
import { StoreQuery } from "src/query/store.query";

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

    @TypedRoute.Get("orders")
    async getOrders(
        @TypedQuery() query : StoreQuery.StoreQueryGetOrdersOptions
    ) : Promise<TryCatch<
    OrderDto[],
    | typeof ERROR.ServerDatabaseError
    | typeof ERROR.ServiceUnavailableException
    >> {
        try {
            const result = await this.storeService.getOrders(query.storeId)
            return {
                data: result,
                status: 200,
            }
        } catch (e) { return e }
    }
}