import { UserEntity } from "../repositories/user/user.entity";
import { PaymentData } from "../common/type/payment";

export type UserDto = Omit<UserEntity, "uuid" | "pass" | "salt" | "refreshtoken">
export type OrderDto = Pick<PaymentData, 
| "amount"
| "apply_num"
| "bank_code"
| "bank_name"
| "buyer_addr"
| "buyer_email"
| "buyer_name"
| "buyer_tel"
| "buyer_postcode"
| "imp_uid"
| "pg_id"
| "pg_provider"
| "status"
| "name"
| "merchant_uid"
| "custom_data"
| "paid_at"
| "pay_method">