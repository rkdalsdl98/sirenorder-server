import { UserEntity } from "src/repositories/user/user.entity";

export type UserDto = Omit<UserEntity, "uuid" | "pass" | "salt">