import { NutritionsEntity } from "./nutritions.entity"

export interface MenuDetailEntity {
    readonly id: number
    readonly description?: string
    readonly allergys: string[]
    readonly nutritions: NutritionsEntity[]
}