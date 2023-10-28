import { 
    createParamDecorator, 
    ExecutionContext,
} from "@nestjs/common";

export namespace AuthDecorator {
    export const GetTokenAndPayload = createParamDecorator((data, context: ExecutionContext) : { payload: any, token: string } => {
        const { user: payload, headers } = context.switchToHttp().getRequest()
        const token = headers.authorization.split(" ")[1]
        return { payload, token }
    })
}