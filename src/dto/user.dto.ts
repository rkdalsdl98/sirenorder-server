import { UserEntity } from "../repositories/user/user.entity";

export type UserDto = Omit<UserEntity, "uuid" | "pass" | "salt">