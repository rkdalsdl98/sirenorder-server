import { 
    CallHandler, 
    ExecutionContext, 
    Injectable, 
    NestInterceptor,
} from "@nestjs/common";
import { Observable, of } from "rxjs";
import { tap } from 'rxjs/operators';
import { ERROR } from "../type/response.type";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler) : Observable<any> {
        const req = context.switchToHttp().getRequest()

        const { path, methods } = req.route
        const method = Object.keys(methods)[0]
        const reqAddress = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress

        if(method === null) return of(ERROR.BadRequest)
        const before = Date.now()
        console.log(`[${Intl.DateTimeFormat('kr').format(before)}]: ${reqAddress} :[${path} : ${method}]`)
        return next.handle().pipe(
            tap(_=> console.log(`[요청 처리 성공] ${ Date.now() - before}/ms`))
        )
    }
}