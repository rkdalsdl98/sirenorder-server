import { OrderDto } from "src/dto/user.dto"
import { RedisService } from "../../services/redis.service"
import { PaymentData } from "../type/payment"
import { ERROR } from "../type/response.type"
import * as dotenv from "dotenv"
import { StoreRepository } from "src/repositories/store/store.repository"
import { RegisteredOrder } from "../type/order.type"
import { StoreCache } from "../type/socket.type"
import { OrderHistory, UserEntity } from "src/repositories/user/user.entity"
import { UserService } from "src/services/user.service"

dotenv.config()
const impKey = process.env.IMP_KEY
const impSecret = process.env.IMP_SECRET
const logPath = "PortOneMethod"

export namespace PortOneMethod {
    export const findOrderByUUID = async ({
        order_uid,
        redis,
    }: {
        order_uid: string,
        redis: RedisService,
    }) : Promise<RegisteredOrder> => {
        const order = await redis.get<RegisteredOrder>(order_uid, logPath)
        if(!order) {
            var err = ERROR.NotFoundData
            err.substatus = "OrderLookupFailed"
            throw err
        }

        return order;
    }

    export const acceptOrder = async ({
        order_uid,
        redis,
        repository,
    }: {
        order_uid: string,
        redis: RedisService,
        repository: StoreRepository,
    }) : Promise<string> => {
        const order = await findOrderByUUID({
            order_uid,
            redis,
        })
        await repository.createOrder(order)
        return order.buyer_email
    }

    export const finishOrder = async ({
        order_uid,
        redis,
        service,
        repository,
    }: {
        order_uid: string,
        redis: RedisService,
        service: UserService,
        repository: StoreRepository,
    }) : Promise<{ 
        buyer_email: string, 
        totalprice: number | string
        history: OrderHistory
    }> => { 
        const order = await removeOrderById({order_uid, redis, repository})
        const store : StoreCache | null | undefined = await redis.get<StoreCache[]>(
            "stores",
            logPath,
        ).then(res => {
            if(res === null) return null
            return res.find(s => s.storeId === order.store_uid)
        })
        if(store === null || store === undefined) throw ERROR.Accepted

        const history = {
            imp_uid: order.imp_uid,
            menus: order.menus,
            saleprice: order.saleprice,
            store_name: store.storename,
            store_thumbnail: store.thumbnail,
            store_uid: store.storeId,
            totalprice: order.totalprice,
            deliveryinfo: order.deliveryinfo,
            order_date: new Date(Date.now()),
        } satisfies OrderHistory
        await service.addOrderHistory(order.buyer_email, history)
        
        return { buyer_email: order.buyer_email, totalprice: order.totalprice, history }
    }

    export const removeOrderById = async ({
        redis,
        order_uid,
        repository,
    } : {
        redis: RedisService,
        order_uid: string,
        repository: StoreRepository,
    }) : Promise<RegisteredOrder> => {
        const order = await findOrderByUUID({
            order_uid,
            redis,
        })
        await repository.deleteOrder(order_uid, order.sales_uid)
        redis.delete(order_uid, logPath)
        return order
    }

    export const refuseOrder = async ({
        redis,
        imp_uid,
        reason,
    }: {
        redis: RedisService,
        imp_uid: string,
        reason: string, 
    }) : Promise<boolean> => {
        const token = await _getCertifiToken()
        const paymentData = await _getPaymentData(imp_uid, token)

        if(paymentData.cancel_amount <= 0) {
            return false // 취소가능 금액이 0원 이하일 경우 처리
        }

        const result = await fetch("https://api.iamport.kr/payments/cancel", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token,
            },
            body: JSON.stringify({
                reason, 
                imp_uid: paymentData.imp_uid, 
                amount: paymentData.cancel_amount, 
                checksum: paymentData.amount
            })
        })
        .then(res => res.json())
        .then(async json => {
            const { response } = json
            const order_uid = response.merchant_uid

            if(!order_uid) throw ERROR.Accepted
            await redis.delete(order_uid, logPath)
            return true
        })
        .catch(_ => {
            var err = ERROR.BadRequest
            err.substatus = "ForgeryData"
            throw err
        })

        return result
    }

    export const findOrder = async (imp_uid: string) :
    Promise<OrderDto> => {
        if(impKey === undefined || impSecret === undefined) 
            throw ERROR.ServiceUnavailableException

        const token = await _getCertifiToken()
        const paymentData : PaymentData = await _getPaymentData(imp_uid, token)
        return {
            amount: paymentData.amount,
            apply_num: paymentData.apply_num,
            bank_code: paymentData.bank_code,
            bank_name: paymentData.bank_name,
            buyer_addr: paymentData.buyer_addr,
            buyer_email: paymentData.buyer_email,
            buyer_name: paymentData.buyer_name,
            buyer_postcode: paymentData.buyer_postcode,
            buyer_tel: paymentData.buyer_tel,
            custom_data: paymentData.custom_data,
            imp_uid: paymentData.imp_uid,
            merchant_uid: paymentData.merchant_uid,
            paid_at: paymentData.paid_at,
            name: paymentData.name,
            pay_method: paymentData.pay_method,
            pg_id: paymentData.pg_id,
            pg_provider: paymentData.pg_provider,
            status: paymentData.status,
        } as OrderDto
    }

    const _getPaymentData = async (imp_uid: string, token: string) => {
        const paymentData = await fetch(`https://api.iamport.kr/payments/${imp_uid}`,
            {
                method: "GET",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": token,
                },
            }
        )
        .then(res => res.json())
        .then(json => {
            const { response } = json
            return { ...response } as PaymentData
        })
        .catch(err => {
            var error = ERROR.NotFoundData
            error.substatus = "OrderLookupFailed"
            throw error
        })

        return paymentData
    }

    const _getCertifiToken = async () : Promise<string> => {
        const token = await fetch("https://api.iamport.kr/users/getToken",{
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                imp_key: impKey,
                imp_secret: impSecret
            })
        })
        .then(res => res.json())
        .then(json => {
            const { response } = json
            return response.access_token
        })
        .catch(err => {
            console.log(err)
            var error = ERROR.ServiceUnavailableException
            error.substatus = "UnAuthorzied"
            throw error
        })

        return token
    }
}