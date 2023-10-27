import { Injectable } from "@nestjs/common";
import { ERROR } from "src/common/type/response.type";
import { UserEntity } from "src/repositories/user/user.entity";
import { AuthService } from "src/services/auth.service";

@Injectable()
export class MockUserRepository {
    private db : UserEntity[] = []

    getAll() : UserEntity[] {
        return this.db
    }

    getBy(email: string) :
    | UserEntity
    | undefined {
        return this.db.find(u => u.email === email)
    }

    create(args: {
        salt: string, 
        hash: string, 
        nickname: string, 
        email: string,
        uuid: string,
    }) : UserEntity {
        if(this._checkDuplicate(args.email)) {
            ERROR.Accepted.substatus = "Duplicated"
            throw ERROR.Accepted
        }
        const user : UserEntity = {
            uuid: args.uuid,
            email: args.email,
            salt: args.salt,
            pass: args.hash,
            nickname: args.nickname,
            wallet: null,
            gifts: [],
            coupons: [],
            order: null,
            orderhistory: [],
            token: null,
            createdAt: new Date(Date.now()),
            updatedAt: new Date(Date.now())
        }
        this.db.push(user)
        return user
    }

    private _checkDuplicate(email: string) : boolean {
        return !!this.getBy(email)
    }

    updateBy(updateData:  Omit<
        UserEntity,
        | "uuid"
        | "email"
        | "pass"
        | "salt"
        | "order"
        | "gifts"
        | "createdAt"
        | "updatedAt"
        >, email: string): UserEntity {
        let updateUser : UserEntity | undefined
        this.db = this.db.map(u => {
            if(u.email === email) {
                const user : UserEntity = {
                    ...u,
                    nickname: updateData.nickname,
                    wallet: {
                        uuid: u.wallet!.uuid!,
                        stars: updateData.wallet!.stars!,
                        point: updateData.wallet!.point!,
                    }
                }
                updateUser = user
                return user
            }
            return u
        })
        if(updateUser === undefined) {
            throw ERROR.NotFoundData
        }
        return updateUser
    }
    
    deleteBy(email: string): boolean {
        let result : boolean = false
        const afterDB : UserEntity[] = []
        this.db.forEach(u => {
            if(u.email === email) result = true
            else afterDB.push(u)
        })
        this.db = afterDB
        return result
    }
}