import { BottleSize } from "src/common/type/menu.type"

export interface NutritionsEntity {
    readonly size: BottleSize
    readonly calorie: string
    readonly carbohydrate: string
    readonly sugars: string
    readonly salt: string
    readonly protein: string
    readonly fat: string
    readonly cholesterol: string
    readonly transfat: string
    readonly saturatedfat: string
    readonly caffeine: string
}