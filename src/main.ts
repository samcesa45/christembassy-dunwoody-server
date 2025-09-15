import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser'
import { ValidationPipe } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
   app.useGlobalPipes(new ValidationPipe({whitelist:true, forbidNonWhitelisted: true}))
   const allowedOrigins = [
    'http://localhost:3000',
    'https://christembassy-dunwoody-client.vercel.app',
  ];
  
  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  };
  app.enableCors(corsOptions);
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
  await app.listen(port, '0.0.0.0');
  console.log(`Server listening on ${port}`);

}
bootstrap();
