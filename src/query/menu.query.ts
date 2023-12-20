import { Category } from "src/repositories/menu/menu.entity";

export namespace MenuQuery {
    export interface MenuQueryGetListOptions {
        readonly category?: Category
    }
    export interface MenuQueryGetDetailOptions {
        readonly detailId: number
    }
}