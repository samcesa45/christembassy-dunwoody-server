import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { BullModule } from '@nestjs/bullmq';
import { MailProcessor } from './mail.processor';

@Global()
@Module({
    imports:[
        BullModule.registerQueue({
            name:'mail-queue',
        }),
    ],
    providers: [MailService,MailProcessor],
    exports: [MailService]
})
export class MailModule {}
