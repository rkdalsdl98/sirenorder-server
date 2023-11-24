import { ISendMailOptions, MailerService } from "@nestjs-modules/mailer"
import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { SentMessageInfo } from "nodemailer"
import { MailTemplate } from "../common/type/mail.type"

@Injectable()
export class EmailService {
    constructor(
        private readonly mailerService: MailerService,
        private readonly config: ConfigService,
    ) {}

    private _authorizationTemplate(secret: string) : string {
        return `
        <br>
            <h2>${secret}</h2>
            <p>
            ${(this.config.get<number>("EMAIL_TTL") ?? 60) / 60}분 이내에\n
            상단에 보이는 숫자를 어플화면에서 입력하고 확인을 눌러주세요.
            </p>
        </br>
    `
    }
    private _defaultTemplate(message: string) : string {
        return `<br><p>${message}</p></br>`
    }

    async sendMail(
        template: MailTemplate,
    ) : Promise<SentMessageInfo> {
        let config: ISendMailOptions = {
            to: template.to,
            from: this.config.get<string>("AUTH_EMAIL"),
            subject: template.title,
        }
        if("secret" in template) {
            config.html = this._authorizationTemplate(template.secret)
        } else {
            config.html = this._defaultTemplate(template.message)
        }
        return await this.mailerService.sendMail(config)
    }
}