import { Module } from "@nestjs/common";
import { MenuController } from "src/controllers/menu.controller";
import { MenuRepository } from "src/repositories/menu/menu.repository";
import { MenuService } from "src/services/menu.service";
import { RedisService } from "src/services/redis.service";

@Module({
    providers: [
        MenuService,
        MenuRepository,
        RedisService,
    ],
    controllers: [MenuController]
})
export class MenuModule {}