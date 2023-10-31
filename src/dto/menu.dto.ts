import { MenuEntity } from "src/repositories/menu/menu.entity";

export type MenuDto = Omit<MenuEntity, "id">