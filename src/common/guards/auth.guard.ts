import { CanActivate, ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { Request } from 'express';
import { ERROR } from "../type/response.type";

@Injectable()
export class AuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext) : Promise<boolean> {
        const req = context.switchToHttp().getRequest()
        const reqAddress = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress
        const token = this._extractTokenFromHeader(req)
        if(token === null) throw ERROR.UnAuthorized
        
        return true
    }

    private _extractTokenFromHeader(request: Request): string | null {
        const [ type, token ] = request.headers.authorization?.split(" ") ?? []
        if(!type || type !== "Bearer") return null
        return token
    }
}