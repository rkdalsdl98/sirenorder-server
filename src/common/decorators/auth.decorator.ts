import { 
    createParamDecorator, 
    ExecutionContext,
} from "@nestjs/common";
import { FailedResponse } from "../type/response.type";

export namespace AuthDecorator {
    export const GetTokenAndPayload = createParamDecorator((data, context: ExecutionContext) : 
    | { payload: any, token: string }
    | { payload: any } => {
        const { user: payload, headers } = context.switchToHttp().getRequest()
        const token : string | undefined = headers.authorization?.split(" ")[1]
        return (payload.authorized === undefined || !payload.authorized) 
        ? { payload } : { payload, token }
    })
    export const IsValidCoupon = createParamDecorator((data, context: ExecutionContext)
    : boolean | FailedResponse => {
        const { user: result } = context.switchToHttp().getRequest()
        if(typeof result === "boolean") {
            return result
        }

        return result as FailedResponse
    })
}