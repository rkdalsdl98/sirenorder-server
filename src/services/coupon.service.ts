import { Injectable, Logger } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CouponRepository } from "src/repositories/coupon/coupon.repository";
import * as dotenv from "dotenv"
import { CouponEntity, CouponInfo, SimpleCouponEntity } from "src/repositories/coupon/coupon.entity";
import { ERROR, FailedResponse } from "src/common/type/response.type";
import { RedisService } from "./redis.service";
import { UserEntity } from "src/repositories/user/user.entity";
import { GiftInfo } from "src/common/type/gift.type";
import { GiftEntity } from "src/repositories/user/gift.entity";
import { SSEService } from "./sse.service";
import { SSESubject, UserNotifySubject } from "src/common/type/sse.type";
dotenv.config()

const coupon_secret = process.env.COUPON_SECRET

// 쿠폰엔티티에 코드와 심플 쿠폰엔티티에 코드는 서로 다르며,
// 각각 암호화된 코드, 암호화 이전 코드이다.

@Injectable()
export class CouponService {
    constructor(
        private readonly auth: AuthService,
        private readonly sseService: SSEService,
        private readonly couponRepoistory: CouponRepository,
        private readonly redis: RedisService,
    ){ this.couponRepoistory.deleteExpiredCoupon() }

    // 쿠폰 발행시 양방향 암호화를 사용하고, salt는 coupon_secret을 이용
    // 쿠폰 검증시 coupon_secret를 이용해서 검증 아닌경우 위조된 정보
    // 발행 루틴: 쿠폰코드 생성(길이 32) => 쿠폰 암호화 => 쿠폰정보등록 =>
    // => 암호화된 쿠폰코드발행 (길이 12)
    // 검증 루틴: 위조확인 => 쿠폰 탐색 => 기간확인 => 사용된 쿠폰정보 폐기
    // => 결과 반환
    
    async publishCoupon(coupon_info: CouponInfo) 
    : Promise<string> {
        const code = this.auth.generateRandStr(12)
        const { hash } = this.auth.encryption(code, coupon_secret, 32)
        const expiration_period = this._createExpirationPeriod(coupon_info.expiration_day)
        const published = await this.couponRepoistory.publishCoupon({
            coupon: {
                code: hash,
                expiration_period,
                menuinfo: coupon_info.menuinfo,
            },
        })
        if(!published) throw ERROR.ServiceUnavailableException
        return code
    }

    /**
     * 2000원 상당 아메리카노 한잔 쿠폰 발행
     * @returns 
     */
    async publishAndRegisterStampCoupon(current_user_email: string)
    : Promise<SimpleCouponEntity> {
        const code = await this.publishCoupon({
            menuinfo: {
                "name": "아메리카노",
                "en_name": "Americano",
                "detailId": 1,
                "thumbnail": "https://firebasestorage.googleapis.com/v0/b/mocatmall.appspot.com/o/americano.jpg?alt=media&token=74fa17d9-05ba-4a81-a828-d00538573b84",
                "count": 1,
                "price": 2000,
            },
        })
        const coupon = await this.registerCoupon(
            current_user_email, 
            code,
            true,
        )
        return coupon
    }

    async registerCoupon(
        current_user_email: string,
        code: string,
        isStamp?: boolean
    ) : Promise<SimpleCouponEntity> {
        const data = await this._validate(code)
        const simple_data = {
            code,
            expiration_period: data.coupon.expiration_period,
            menu_name: data.coupon.menuinfo.name,
            thumbnail: data.coupon.menuinfo.thumbnail,
        } as SimpleCouponEntity
        try {
            const registered = await this.couponRepoistory.registerCoupon({
                current_user_email,
                coupon: simple_data,
                isStamp: isStamp
            })
            if(!registered) {
                if(isStamp !== undefined && isStamp) {
                    await this.deleteCoupon({
                        user_email: current_user_email,
                        code,
                        message: "스탬프의 개수가 모자라 쿠폰발행이 취소됩니다",
                        title: "스탬프 개수 부족",
                    })
                    throw ERROR.Accepted
                }
                throw ERROR.Accepted
            }
    
            this._updateCouponFromUser(
                current_user_email,
                code,
                data.coupon,
            )
            this.sseService.pushMessage({
                notify_type: "user-notify",
                subject: {
                    message: "스탬프를 사용해 쿠폰을 지급 받으셨습니다\n쿠폰함을 확인 해주세요!",
                    title: "쿠폰발행",
                    receiver_email: current_user_email,
                } satisfies UserNotifySubject
            } satisfies SSESubject)
            return simple_data
        } catch(e) {
            if(typeof ERROR.Accepted !== typeof e) {
                await this.deleteCoupon({
                    user_email: current_user_email,
                    code,
                    message: "쿠폰등록에 실패했습니다"
                })
            }
            throw e
        }
    }

    
    async sendGift(giftInfo: GiftInfo) : Promise<GiftEntity> {
        const code = await this.publishCoupon({
            menuinfo: giftInfo.menu,
            expiration_day: 1,
        })
        const coupon = await this.registerCoupon(giftInfo.to, code)
        const gift_uid = this.auth.getRandUUID()
        await this.couponRepoistory.updateGift({
            uuid: gift_uid,
            gift: giftInfo,
            coupon,
        })
        return {
            coupon,
            from: giftInfo.from,
            to: giftInfo.to,
            message: giftInfo.message,
            uuid: gift_uid,
            wrappingtype: giftInfo.wrappingtype,
            used: false,
        }
    }

    async useGiftCoupon(
        user_email: string, 
        code: string, 
        gift_uid: string
    ) 
    : Promise<boolean> {
        const { hash } = await this._validate(code)
        return await this._deleteGift(
            user_email,
            hash,
            gift_uid,
        )
    }
            
    async useCoupon(
        user_email: string, 
        code: string
    ) 
    : Promise<{ message: string, result: boolean | CouponEntity }> {
        const { hash, coupon } = await this._validate(code)
        try {
            await this._deleteCoupon(
                user_email, 
                code, 
                hash,
            )
            return {
                message: "성공적으로 주문요청을 보냇습니다.",
                result: coupon
            }
        } catch(e) {
            return {
                message: "쿠폰사용중 오류가 발생해 주문이 취소되었습니다.",
                result: false,
            }
        }
    }
                
    async deleteCoupon(args :{
        user_email: string,
        code: string,
        message: string,
        title?: string,
    })
    : Promise<boolean> {
        const { hash } = this.auth.encryption(args.code, coupon_secret, 32)
        this.sseService.pushMessage({
            notify_type: "user-notify",
            subject: {
                message: args.message,
                title: args.title ?? "쿠폰회수",
                receiver_email: args.user_email,
            } as UserNotifySubject
        })
        try{
            await this._deleteCoupon(args.user_email, args.code, hash)
            return true
        } catch(e) {
            const err = e as FailedResponse
            Logger.log(`쿠폰회수를 실패했습니다.\n상태코드: ${err.status}\n사유: ${err.message}${err.substatus !== undefined ? `상태상세: ${err.substatus}` : ""}`)
            return false
        }
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
            ).then(_=> {
                this._removeGiftFromUser(user_email)
                return true
            })
    }

    private async _validate(code: string)
    : Promise<{ hash: string, coupon: CouponEntity }> {
        const { hash } = this.auth.encryption(code, coupon_secret, 32)
        const coupon = await this.couponRepoistory.getBy(hash)
        const validate = this._checkExpirationPeriod(coupon.expiration_period)
        if(!validate) {
            var err = ERROR.BadRequest
            err.substatus = "ExpiredCoupon"
            throw err
        }
        return {
            hash,
            coupon,
        }
    }
        
    private async _deleteCoupon(
        user_email: string, 
        code: string,
        encryption_code: string,
    )
    : Promise<void> {
        await this.couponRepoistory.deleteCoupon(
            user_email, 
            code,
            encryption_code,
        )
        this._removeCouponFromUser(
            user_email,
            code,
        )
    }
    
    private _createExpirationPeriod(day?: number) : Date {
        return new Date(Date.now() + (((60 * 1000) * 60) * (24 * (day ?? 1))))
    }
    
    private _checkExpirationPeriod(date: Date) : boolean {
        const now = new Date(Date.now())
        return now <= date
    }
        
    private async _removeGiftFromUser(user_email: string)
    : Promise<void> {
        const caches = await this.redis.get<UserEntity[]>("users", CouponService.name)
        const user = caches?.find(u => u.email === user_email)
        if(user && caches) {
            const after = caches!.filter(u => u.email !== user_email)
            await this.redis.set("users", 
            [...after, {
                ...user,
                gifts: user.gifts.map(g => {
                    if(user_email === g.to) {
                        g.used = true
                    }
                    return g;
                }),
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
        isStamp?: boolean
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
                wallet: { stars: (isStamp !== undefined && isStamp) ? 0 : user.wallet?.stars },
                coupons: user.coupons,
            } as UserEntity], 
                CouponService.name
            )
        }
    }
}