import { OrderEntity } from "src/repositories/user/order.entity";
import { UserEntity } from "../repositories/user/user.entity";

export type UserDto = Omit<UserEntity, "uuid" | "pass" | "salt" | "refreshtoken">
export type OrderDto = Omit<OrderEntity, "uuid">