import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerSetting } from './swagger.setting';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as dotenv from "dotenv"
import { Logger } from '@nestjs/common';
dotenv.config()

const server_port : number = parseInt(process.env.SERVER_PORT ?? "3000")

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: "*",
    methods: 'GET,PUT,PATCH,POST,DELETE',
    credentials: true,
  })
  
  SwaggerSetting(app)
  app.useGlobalInterceptors(new LoggingInterceptor())
  app.useWebSocketAdapter(new IoAdapter(app))

  await app.listen(server_port)
  .then(_=> Logger.log(`API 서버 초기화 ✅ : 대기 포트 => ${server_port}`, "APIServer"))
}
bootstrap();
