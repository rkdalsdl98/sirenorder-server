import { StoreDetailEntity } from "src/repositories/store/storedetail.entity";
import { StoreEntity } from "../repositories/store/store.entity";

export type StoreDto = Partial<StoreEntity> & { isOpen: boolean }
export type StoreDetailDto = Partial<StoreDetailEntity> 