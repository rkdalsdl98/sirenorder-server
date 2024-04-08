import { tags } from "typia"

export namespace UserQuery {
    export interface UserQueryLoginOptions {
        readonly email: string & tags.Format<"email">
        readonly pass: 
        string 
        // & tags.Pattern<"[0-9a-zA-Z]{6,20}">
        // & tags.Pattern<"[\!\`\~\@\#\$\%\^\&\*\_\+\=\/\>\<\?]{1,}">
    }
    
    export interface UserQueryRegistOptions extends UserQueryLoginOptions {
        readonly nickname: string & tags.MaxLength<10>
    }

    export interface UserQueryVerifyCode {
        readonly code: string & tags.MaxLength<6>
    }

    export interface UserQueryCreateOptions {
        readonly email: string & tags.Format<"email">
    }
}