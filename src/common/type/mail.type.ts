export type DefaultMailTemplate = {
    to: string
    title: string
    message: string
}

export type AuthorizationMailTemplate = {
    to: string
    title: string
    secret: string
}

export type MailTemplate = DefaultMailTemplate | AuthorizationMailTemplate