import { Injectable } from "@nestjs/common";
import { MerchantRepository } from "../repositories/store/merchant.repository";
import { AuthService } from "./auth.service";

@Injectable()
export class MerchantService {
    constructor(
        private readonly merchantRepository: MerchantRepository,
        private readonly auth: AuthService,
    ){}
}