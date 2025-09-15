import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { DonationsModule } from './donations/donations.module';
import { PaystackService } from './paystack/paystack.service';
import { PaystackModule } from './paystack/paystack.module';
import { WebhooksController } from './webhooks/webhooks.controller';
import { PrismaService } from './prisma/prisma.service';
import { MailService } from './mail/mail.service';
import { MailModule } from './mail/mail.module';
import {BullModule} from '@nestjs/bullmq'
import { ConfigModule } from '@nestjs/config';
import { BullmqModule } from './bullmq/bullmq.module';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import mailConfig from './config/mail.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load:[databaseConfig, redisConfig, mailConfig]
    }),
    BullmqModule,
    MailModule,
    DonationsModule, 
    PaystackModule,
  ],
    
  controllers: [WebhooksController],
  providers: [AppService, PaystackService, PrismaService],
})
export class AppModule {}
