import { MenuDetailEntity } from "src/repositories/menu/menudetail.entity";

export type MenuDetailDto = Omit<MenuDetailEntity, "id">