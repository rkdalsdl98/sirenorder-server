export type SubStatus = "ReLogin" | "TypeException" | "ForgeryData" | "ExpiredToken"

export type SuccessResponse<T> = {
    readonly data: T
    readonly status: number
    readonly metadata?: unknown
}

export type FailedResponse = {
    readonly message: string
    readonly status: number
    readonly substatus?: SubStatus
}

export const ERROR : Record<string, FailedResponse> = {
    "NonAuthoritativeInformation": { status: 203, message: "입력한 정보가 맞는지 한번 더 확인해주세요." },
    "NotFoundData": { status: 204, message: "요청한 자료를 찾을 수 없습니다." },
    "BadRequest": { status: 400, message: "잘못된 요청 입니다." },
    "UnAuthorized": { status: 401, message: "해당 요청에 필요한 자격 증명에 실패 했습니다." },
    "Forbidden": { status: 403, message: "서버에 의해 요청이 차단 되었습니다." },
    "NotFound": { status: 404, message: "요청 페이지 또는 데이터를 찾을 수 없습니다." },
    "MethodNotAllowd": { status: 405, message: "허용되지 않은 메소드 입니다." },
    "RequestTimeOut": { status: 408, message: "서버에 요청시간이 만료 되었습니다." },
    "Conflict": { status: 409, message: "중복된 요청 혹은 연속된 요청으로 해당 요청이 취소 되었습니다." },
    "TooManyRequests": { status: 429, message: "과도한 요청으로 인해 요청이 취소 되었습니다." },
    "BadGateway": { status: 502, message: "요청을 처리하지 못했습니다.\n네트워크 장치를 확인 한 이후에 다시 시도해주세요." },
    "ServiceUnavailableException": { status: 503, message: "현재 해당 요청을 처리할 수 없습니다.\n나중에 다시 시도해주세요."},
    "ServerDatabaseError": { status: 5000, message: "서버에 상태가 불안정해 정보를 가져올 수 없습니다." },
    "ServerCacheError": { status: 5001, message: "서버에 상태가 불안정해 정보를 가져올 수 없습니다." },
    "FailedSendMail": { status: 5001, message: "서버에 상태가 불안정해 메일전송에 실패했습니다." },
}

export type KeyOfValue = keyof typeof ERROR
export type ValueOfERROR = (typeof ERROR)[KeyOfValue]
export type TryCatch<T, E extends FailedResponse> = SuccessResponse<T> | E