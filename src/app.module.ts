import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from './modules/redis.module';
import { UserModule } from './modules/user.module';
import { AuthModule } from './modules/auth.module';
import { MenuModule } from './modules/menu.module';
import { StoreModule } from './modules/store.module';

@Module({
  imports: [
    RedisModule,
    UserModule,
    AuthModule,
    MenuModule,
    StoreModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: `smtps://${config.get<string>("AUTH_EMAIL")}:${config.get<string>("AUTH_PASSWORD")}@${config.get<string>("EMAIL_HOST")}`,
        defaults: {
          from: `"${config.get<string>("EMAIL_FROM_USER_NAME")}" <${config.get<string>("AUTH_EMAIL")}>`,
        },
      })
    }),
  ]
})
export class AppModule {}
