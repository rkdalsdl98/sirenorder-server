import { TypedBody, TypedQuery, TypedRoute } from "@nestia/core";
import { Body, Controller } from "@nestjs/common";
import { ERROR, TryCatch } from "src/common/type/response.type";
import { MerchantQuery } from "src/query/merchant.query";
import { MerchantService } from "src/services/merchant.service";

@Controller("merchant")
export class MerchantController {
    constructor(
        private readonly merchantService: MerchantService,
    ){}

    @TypedRoute.Get()
    async getTest() {
        const result = await this.merchantService.getTest()
        return {
            data: result,
            status: 200,
        }
    }

    @TypedRoute.Post("regist")
    async registMerchant(
        @Body() body: MerchantQuery.MerchantQueryRegist
    ) :
    Promise<TryCatch<
    { uuids: { merchant: string, store: string, wallet: string } },
    | typeof ERROR.ServerDatabaseError
    >> {
        try {
            const result = await this.merchantService.registMerchant(body.data)
            return {
                data: { uuids: result },
                status: 201,
            }
        } catch(e) { return e }
    }

    @TypedRoute.Delete()
    async deleteMerchant(
        @TypedQuery() query: { uuid: string }
    ):
    Promise<TryCatch<
    boolean,
    | typeof ERROR.ServerDatabaseError
    >> {
        try {
            const result = await this.merchantService.deleteMerchant(query.uuid)
            return {
                data: result,
                status: 200,
            }
        } catch(e) { return e }
    }
}