import { APP_FILTER, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser'
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
   app.useGlobalPipes(new ValidationPipe({whitelist:true, forbidNonWhitelisted: true}))
   const origin = process.env.CORS_ORIGIN || 'http://localhost:3000' || 'https://christembassy-dunwoody-client.vercel.app/';
   app.enableCors({origin, credentials:true})
  // Must register before handlers so req.rawBody is available in controllers
  app.use(
    bodyParser.json({
      verify: (req: any, res, buf) => {
        req.rawBody = buf.toString();
      },
      limit: '1mb'
    })
  )
  const port = process.env.PORT ?? 4000
  await app.listen(port);
  console.log(`Server listening on ${port}`);

}
bootstrap();
