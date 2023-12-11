import { Injectable } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CouponRepository } from "src/repositories/coupon/coupon.repository";
import * as dotenv from "dotenv"
import { CouponEntity, CouponInfo, SimpleCouponEntity } from "src/repositories/coupon/coupon.entity";
import { ERROR } from "src/common/type/response.type";
import { RedisService } from "./redis.service";
import { UserEntity } from "src/repositories/user/user.entity";
import { OrderInfo } from "src/common/type/order.type";
import { GiftInfo } from "src/common/type/gift.type";
dotenv.config()

const coupon_secret = process.env.COUPON_SECRET

// 쿠폰엔티티에 코드와 심플 쿠폰엔티티에 코드는 서로 다르며,
// 각각 암호화된 코드, 암호화 이전 코드이다.

@Injectable()
export class CouponService {
    // 서버로드시 유효기간이 지난 쿠폰들은 폐기처리
    
    constructor(
        private readonly auth: AuthService,
        private readonly couponRepoistory: CouponRepository,
        private readonly redis: RedisService,
    ){}
    
    // 쿠폰 발행시 양방향 암호화를 사용하고, salt는 coupon_secret을 이용
    // 쿠폰 검증시 coupon_secret를 이용해서 검증 아닌경우 위조된 정보
    // 발행 루틴: 쿠폰코드 생성(길이 32) => 쿠폰 암호화 => 쿠폰정보등록 =>
    // => 암호화된 쿠폰코드발행 (길이 12)
    // 검증 루틴: 위조확인 => 쿠폰 탐색 => 기간확인 => 사용된 쿠폰정보 폐기
    // => 결과 반환

    async publishCoupon(
        current_user_email: string,
        coupon_info: CouponInfo,
    ) 
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
            },
            coupon_code: code,
        })
        .then(async coupon => {
            await this._updateCouponFromUser(
                current_user_email,
                code,
                coupon,
            )
            return coupon
        })

        return {
            code,
            expiration_period,
            menu_name: coupon.menuinfo.name,
            thumbnail: coupon.menuinfo.thumbnail,
        }
    }

    private async _validate(code: string)
    : Promise<string> {
        const { hash } = this.auth.encryption(code, coupon_secret, 32)
        const coupon = await this.couponRepoistory.getBy(hash)
        const validate = this._checkExpirationPeriod(coupon.expiration_period)
        if(!validate) {
            var err = ERROR.BadRequest
            err.substatus = "ExpiredCoupon"
            throw err
        }
        return hash
    }

    async sendGift(giftInfo: GiftInfo) : Promise<void> {
        const coupon = await this.publishCoupon(
            giftInfo.to,
            {
                menuinfo: giftInfo.menu,
                expiration_day: 1,
            }
        )

        const gift_uid = this.auth.getRandUUID()
        await this.couponRepoistory.updateGift({
            uuid: gift_uid,
            gift: giftInfo,
            coupon,
        })
    }

    async useGiftCoupon(
        user_email: string, 
        code: string, 
        gift_uid: string
    ) 
    : Promise<boolean> {
        const hashCode = await this._validate(code)
        return await this._deleteGift(
            user_email,
            hashCode,
            gift_uid,
        )
    }

    async useCoupon(user_email: string, code: string) 
    : Promise<boolean> {
        const hashCode = await this._validate(code)
        const deleteCoupon = await this._deleteCoupon(user_email, code, hashCode)
        return deleteCoupon
    }

    async deleteCoupon(user_email: string, code: string)
    : Promise<boolean> {
        const { hash } = this.auth.encryption(code, coupon_secret, 32)
        return await this._deleteCoupon(user_email, code, hash)
    }

    private async _deleteGift(
        user_email: string, 
        encryption_code: string, 
        gift_uid: string
    ) {
        return await this.couponRepoistory.deleteGiftCoupon(
            user_email,
            encryption_code,
            gift_uid,
        ).then(async _=> {
            await this._removeGiftFromUser(user_email, gift_uid)
            return true
        })
    }

    private async _deleteCoupon(
        user_email: string, 
        code: string,
        encryption_code: string,
    )
    : Promise<boolean> {
        return await this.couponRepoistory.deleteCoupon(
            user_email, 
            code,
            encryption_code,
        )
        .then(async _ => {
            await this._removeCouponFromUser(
                user_email,
                code,
            )
            return true
        })
    }

    private _createExpirationPeriod(day?: number) : Date {
        return new Date(Date.now() + (((60 * 1000) * 60) * (24 * (day ?? 1))))
    }

    private _checkExpirationPeriod(date: Date) : boolean {
        const now = new Date(Date.now())
        return now <= date
    }

    private async _removeGiftFromUser(
        user_email: string,
        gift_uid: string,
    )
    : Promise<void> {
        const caches = await this.redis.get<UserEntity[]>("users", CouponService.name)
        const user = caches?.find(u => u.email === user_email)
        if(user && caches) {
            const after = caches!.filter(u => u.email !== user_email)
            await this.redis.set("users", 
            [...after, {
                ...user,
                gifts: user.gifts.filter(c => c.uuid !== gift_uid),
            } as UserEntity], 
                CouponService.name
            )
        }
    }

    private async _removeCouponFromUser(
        user_email: string,
        code: string,
    ) : Promise<void> {
        const caches = await this.redis.get<UserEntity[]>("users", CouponService.name)
        const user = caches?.find(u => u.email === user_email)
        if(user && caches) {
            const after = caches!.filter(u => u.email !== user_email)
            await this.redis.set("users", 
            [...after, {
                ...user,
                coupons: user.coupons.filter(c => c.code !== code),
            } as UserEntity], 
                CouponService.name
            )
        }
    }

    private async _updateCouponFromUser(
        user_email: string,
        code: string,
        coupon: CouponEntity,
    ) : Promise<void> {
        const caches = await this.redis.get<UserEntity[]>("users", CouponService.name)
        const user = caches?.find(u => u.email === user_email)
        if(user && caches) {
            const after = caches!.filter(u => u.email !== user_email)
            user.coupons.push({
                code,
                expiration_period: coupon.expiration_period,
                menu_name: coupon.menuinfo.name,
                thumbnail: coupon.menuinfo.thumbnail,
            } as SimpleCouponEntity)

            await this.redis.set("users", 
            [...after, {
                ...user,
                coupons: user.coupons,
            } as UserEntity], 
                CouponService.name
            )
        }
    }
}