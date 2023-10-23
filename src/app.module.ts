import { MailerModule } from '@nestjs-modules/mailer';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-ioredis';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        store: redisStore,
        host: config.get<string>("SERVER_IP_DEV"),
        port: config.get<number>("REDIS_PORT"),
        ttl: config.get<number>("REDIS_TTL"),
        isGlobal: true,
      })
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
    })
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
