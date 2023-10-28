import { tags } from "typia"

export namespace UserQuery {
    export interface UserQueryLoginOptions {
        readonly email: string & tags.Format<"email">
        readonly pass: string & tags.Pattern<"[a-zA-Z]+"> & tags.MaxLength<20>
    }

    export interface UserQueryRegistOptions extends UserQueryLoginOptions {
        readonly nickname: string & tags.MaxLength<10>
    }

    export interface UserQueryVerifyCode {
        readonly code: string & tags.MaxLength<6>
    }
}