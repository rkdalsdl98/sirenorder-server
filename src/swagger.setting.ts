/**
 * 네스티아에서 사용법과 일반 NestJs에서 사용되는 방법이 기재되어 있다.
 */

import { INestApplication } from "@nestjs/common";
import { readFileSync } from "fs";
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import * as path from "path";

export const SwaggerSetting = (app: INestApplication) => {
    // 네스티아에서는 내가 기입한 내용들을 바탕으로 .json형식으로 뱉어내기 때문에
    // 해당파일의 경로를 불러오는것 이다.
    //
    // 기본적으로 네스티아 빌드를 하게되면 dist 폴더를 만들어 그곳에서 실행 시키는데
    // 해당 설정파일들 또한 그곳에 있는 파일로 사용되는지 경로 시작점이 dist이다.
    const swaggerConfig = readFileSync(path.join(__dirname,"../../swagger/swagger.json"), 'utf-8')


    // NestJs에서 사용되는 방식이다.
    // 네스티아에 swager.info와 흡사하게 생긴것으로 보아 같은 역할을 하는것 같다.
    // NestJs 스웨거는 여러 데코레이터를 지원하는데 그 데코레이터들을 사용하여
    // 모든 라우터에 일일이 표기 해주어야 한다.

    // const swaggerConfig = new DocumentBuilder()
    // .setTitle('MocatMall')
    // .setDescription('MocatMall API')
    // .setVersion('1.0.0')
    // .build();

    // const document = SwaggerModule.createDocument(app, swaggerConfig);
    // NestJS swagger settings...
    
    // 설정파일을 마지막에 json파싱을 해주는데 documentbuilder로 만들어진 설정파일은
    // 파싱할 필요가 없다.
    SwaggerModule.setup('api', app, JSON.parse(swaggerConfig))
}