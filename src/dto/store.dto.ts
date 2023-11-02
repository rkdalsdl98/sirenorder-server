import { StoreEntity } from "../repositories/store/store.entity";

export type StoreDto = Partial<StoreEntity>
export type StoreDetailDto = Omit<StoreDto, 
| "storename"
| "thumbnail"
| "location"
| "address"
| "wallet">