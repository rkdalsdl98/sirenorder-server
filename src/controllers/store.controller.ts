import { TypedBody, TypedParam, TypedQuery, TypedRoute } from "@nestia/core";
import { Controller } from "@nestjs/common";
import { ERROR, TryCatch } from "../common/type/response.type";
import { StoreDetailDto, StoreDto } from "../dto/store.dto";
import { StoreService } from "../services/store.service";
import { StoreBody, StoreQuery } from "src/query/store.query";
import { OrderEntity } from "src/repositories/user/order.entity";

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

    @TypedRoute.Get("order")
    async getOrders(
        @TypedQuery() query : StoreQuery.StoreQueryGetOrdersOptions
    ) : Promise<TryCatch<
    OrderEntity[],
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

    @TypedRoute.Post("order/send")
    async sendOrder(
        @TypedBody() body : StoreBody.StoreBodyCreateOrderOptions
    ) : Promise<TryCatch<
    { orderId: string | null, result: boolean },
    | typeof ERROR.ServerDatabaseError
    | typeof ERROR.ServiceUnavailableException
    >> {
        try {
            const result = await this.storeService.sendOrder(body)
            return {
                data: result,
                status: 201,
            }
        } catch(e) { return e }
    }
}