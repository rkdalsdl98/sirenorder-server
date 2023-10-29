import { tags } from "typia"

export interface IPayload {}
export namespace IPayload {
    export interface IPayloadUser {
        readonly email: string & tags.Format<"email">
        readonly authorized: boolean
    }
}