import { TypedBody, TypedQuery, TypedRoute } from "@nestia/core";
import { Controller, Logger } from "@nestjs/common";
import { ERROR, TryCatch } from "../common/type/response.type";
import { StoreDetailDto, StoreDto } from "../dto/store.dto";
import { StoreService } from "../services/store.service";
import { PortOneRequest, StoreQuery } from "src/query/store.query";
import { OrderEntity } from "src/repositories/user/order.entity";
import { OrderState } from "src/common/type/order.type";

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

    @TypedRoute.Get("detail")
    async getStoreDetail(
        @TypedQuery() query: StoreQuery.StoreQueryGetStoreDetailOptions
    ) : Promise<TryCatch<
    StoreDetailDto,
    | typeof ERROR.ServerDatabaseError
    >> {
        try {
            const result = await this.storeService.getStoreDetailBy(query.detailId)
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

    @TypedRoute.Get("order/state")
    async getOrderState(
        @TypedQuery() query: StoreQuery.StoreQueryGetOrderStateOptions
    ) : Promise<TryCatch<
    OrderState | null,
    | typeof ERROR.ServerCacheError
    | typeof ERROR.NotFoundData
    | typeof ERROR.ServiceUnavailableException
    >> {
        try {
            const result = await this.storeService.getOrderState(query.order_uid)
            return {
                data: result,
                status: 200,
            }
        } catch(e) { return e }
    }

    @TypedRoute.Post("order/payment/webhook")
    async handlePaymentWebhook(
        @TypedBody() body: PortOneRequest.PortOneRequestBody
    ) : Promise<number> {
        try {
            await this.storeService.paymentFactory({
                imp_uid: body.imp_uid,
                order_uid: body.merchant_uid,
                status: body.status,
            })
            return 201
        } catch(e) {
            Logger.error("결제처리중 오류가 발생했습니다.", StoreController.name)
            Logger.error(e)
            return 400
        }
    }
}