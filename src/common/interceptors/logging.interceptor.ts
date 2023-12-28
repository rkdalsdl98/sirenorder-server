import { 
    CallHandler, 
    ExecutionContext, 
    Injectable, 
    InternalServerErrorException, 
    NestInterceptor,
} from "@nestjs/common";
import { Observable, of } from "rxjs";
import { catchError, tap } from 'rxjs/operators';
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
        return next
        .handle()
        .pipe(
            tap(_=> console.log(`[요청 처리 성공] ${ Date.now() - before}/ms`)),
            catchError((err, _) => {
                this.handleException(
                    `[요청 처리 실패] ${ Date.now() - before}/ms`, 
                    err,
                )
                var error = ERROR.Accepted
                error.substatus = "TypeException"
                return of(error)
            })
        )
    }

    handleException(logmessage: string, err: any) {
        if(err instanceof InternalServerErrorException) {
            const res = err.getResponse()
            if(typeof res === 'string') {
                console.log(`Path: ${err['path']} ${res['path']}\nResponse: ${res}`)
            } else {
                console.log(`Path: ${err['path']} ${res['path']}\nReason: ${res['reason']}\nmessage: ${res['message']}`)
            }
        } else console.log(err)
        console.log(logmessage)
    }
}