import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerSetting } from './swagger.setting';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { IoAdapter } from '@nestjs/platform-socket.io';

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

  await app.listen(3000);
}
bootstrap();
