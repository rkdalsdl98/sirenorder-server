import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerSetting } from './swagger.setting';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: "*",
    methods: 'GET,PUT,PATCH,POST,DELETE',
    credentials: true,
  })
  
  //SwaggerSetting(app)
  
  await app.listen(3000);
}
bootstrap();
