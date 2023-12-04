import { Injectable } from "@nestjs/common";
import { UserRepository } from "src/repositories/user/user.repository";
import { AuthService } from "./auth.service";
import { CouponRepository } from "src/repositories/coupon/coupon.repository";
import * as dotenv from "dotenv"
import { CouponInfo, SimpleCouponEntity } from "src/repositories/coupon/coupon.entity";
import { ERROR } from "src/common/type/response.type";
dotenv.config()

const coupon_secret = process.env.COUPON_SECRET

@Injectable()
export class CouponService {
    // 서버로드시 유효기간이 지난 쿠폰들은 폐기처리
    
    constructor(
        private readonly auth: AuthService,
        private readonly couponRepoistory: CouponRepository,
    ){}
    
    // 쿠폰 발행시 양방향 암호화를 사용하고, salt는 coupon_secret을 이용
    // 쿠폰 검증시 coupon_secret를 이용해서 검증 아닌경우 위조된 정보
    // 발행 루틴: 쿠폰코드 생성(길이 32) => 쿠폰 암호화 => 쿠폰정보등록 =>
    // => 암호화된 쿠폰코드발행 (길이 12)
    // 검증 루틴: 위조확인 => 쿠폰 탐색 => 기간확인 => 사용된 쿠폰정보 폐기
    // => 결과 반환

    async publishCoupon(current_user_email: string, coupon_info: CouponInfo) 
    : Promise<SimpleCouponEntity> {
        const code = this.auth.generateRandStr(12)
        const { hash } = this.auth.encryption(code, coupon_secret, 32)
        const expiration_period = this._createExpirationPeriod(coupon_info.expiration_day)
        const coupon = await this.couponRepoistory.publishCoupon({
            current_user_email,
            coupon: {
                code: hash,
                expiration_period,
                menuinfo: coupon_info.menuinfo,
            }
        })

        return {
            code,
            expiration_period,
            menu_name: coupon.menuinfo.name,
            thumbnail: coupon.menuinfo.thumbnail,
        }
    }

    async useCoupon(user_email: string, code: string) 
    : Promise<boolean> {
        const { hash } = this.auth.encryption(code, coupon_secret, 32)
        const coupon = await this.couponRepoistory.getBy(hash)
        const validate = this._checkExpirationPeriod(coupon.expiration_period)
        const deleteCoupon = await this.couponRepoistory.deleteCoupon(user_email, code)

        if(!deleteCoupon) {
            throw ERROR.NotFoundData
        }

        return validate
    }

    async deleteCoupon(user_email: string, code: string)
    : Promise<boolean> {
        const { hash } = this.auth.encryption(code, coupon_secret, 32)
        return await this.couponRepoistory.deleteCoupon(user_email, hash)
    }

    private _createExpirationPeriod(day?: number) : Date {
        return new Date(Date.now() + (((60 * 1000) * 60) * (24 * (day ?? 1))))
    }

    private _checkExpirationPeriod(date: Date) : boolean {
        const now = new Date(Date.now())
        return now <= date
    }
}