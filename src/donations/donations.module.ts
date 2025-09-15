import { Module } from '@nestjs/common';
import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaystackModule } from 'src/paystack/paystack.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
    imports: [PaystackModule,MailModule],
    controllers: [DonationsController],
    providers: [DonationsService,PrismaService],
})
export class DonationsModule {}
