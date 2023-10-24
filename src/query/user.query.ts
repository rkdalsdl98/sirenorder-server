import { tags } from "typia"

export namespace UserQuery {
    export interface UserQueryFindOptions {
        readonly email: string & tags.Format<"email">
    }
}