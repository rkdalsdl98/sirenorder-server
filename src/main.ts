import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerSetting } from './swagger.setting';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: "*",
    methods: 'GET,PUT,PATCH,POST,DELETE',
    credentials: true,
  })
  
  //SwaggerSetting(app)
  app.useGlobalInterceptors(new LoggingInterceptor())
  await app.listen(3000);
}
bootstrap();
