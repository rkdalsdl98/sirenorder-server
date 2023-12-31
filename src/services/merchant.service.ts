import { Injectable } from "@nestjs/common";
import { MerchantRepository } from "../repositories/store/merchant.repository";
import { AuthService } from "./auth.service";
import { MerchantDto } from "src/dto/merchant.dto";
import { StoreCache } from "src/common/type/socket.type";
import { RedisService } from "./redis.service";

@Injectable()
export class MerchantService {
    constructor(
        private readonly merchantRepository: MerchantRepository,
        private readonly auth: AuthService,
        private readonly redis: RedisService,
    ){}

    async getTest() {
        return await this.merchantRepository.getMany()
    }

    async deleteMerchant(uuid: string) {
        return await this.merchantRepository.deleteBy({ uuid })
    }

    async registMerchant(createData: MerchantDto)
    : Promise<{ merchant: string, store: string, wallet: string }> {
        const { hash, salt } = this.auth.encryption({ pass: createData.pass })
        const uuids = {
            merchant: this.auth.getRandUUID(), 
            store: this.auth.getRandUUID(), 
            wallet: this.auth.getRandUUID(),
        }
        await this.merchantRepository.create({
            createData,
            uuids,
            pass: hash,
            salt,
        }).then(async merchant => {
            const store = merchant.store
            const caches = await this.redis.get<StoreCache[]>("stores", MerchantService.name) ?? []
            await this.redis.set(
                "stores", [...caches, 
                {...store, storeId: store.uuid, isOpen: false} as StoreCache], 
                MerchantService.name
            )
        })
        return uuids
    }
}