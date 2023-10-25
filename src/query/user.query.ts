import { tags } from "typia"

export namespace UserQuery {
    export interface UserQueryFindOptions {
        readonly email: string & tags.Format<"email">
    }

    export interface UserQueryRegistOptions extends UserQueryFindOptions {
        readonly pass: string & tags.Pattern<"[a-zA-Z]+"> & tags.MaxLength<20>
        readonly nickname: string & tags.MaxLength<10>
    }

    export interface UserQueryVerifyCode {
        readonly code: string & tags.MaxLength<6>
    }
}