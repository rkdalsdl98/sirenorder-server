import { MerchantDto } from "src/dto/merchant.dto";
import { tags } from "typia"

export namespace MerchantQuery {
    export interface MerchantQueryRegist {
        readonly body: MerchantDto
    }
    export interface MerchantQueryLogin {
        readonly uuid: string
        readonly pass: 
        string 
        & tags.Pattern<"[0-9a-zA-Z]{6,20}">
        & tags.Pattern<"[\!\`\~\@\#\$\%\^\&\*\_\+\=\/\>\<\?]{1,}">
    }
}