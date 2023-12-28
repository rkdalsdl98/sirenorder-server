import { tags } from "typia"

export namespace SSEQuery {
    export interface SSEQueryListenOptions {
        readonly listener_email: string & tags.Format<"email">
    }
}