import { Injectable } from "@nestjs/common";
import { MerchantRepository } from "../repositories/store/merchant.repository";
import { AuthService } from "./auth.service";
import { MerchantDto } from "src/dto/merchant.dto";

@Injectable()
export class MerchantService {
    constructor(
        private readonly merchantRepository: MerchantRepository,
        private readonly auth: AuthService,
    ){}

    async getTest() {
        return this.merchantRepository.getMany()
    }

    async registMerchant(createData: MerchantDto)
    : Promise<{ merchant: string, store: string, wallet: string }> {
        const { hash, salt } = await this.auth.encryption({ pass: createData.pass })
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
        })
        return uuids
    }
}