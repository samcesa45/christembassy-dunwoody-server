import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue} from 'bullmq';


@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor( @InjectQueue('mail-queue') private mailQueue: Queue) {}

    async addMailJob(data: {to: string; subject: string; text: string}) {
        await this.mailQueue.add('sendMail', data, {
            attempts: 3,
            backoff: {type: 'exponential',delay: 5000}
        })
    }

    async enqueueDonationSuccess(payload: {
        to?: string;
        name?: string;
        amount: number;
        currency?: string;
        reference: string;
    }) {
        if(!payload.to) {
            this.logger.warn('No recipient email provided; skipping enqueue');
            return;
        }

        const subject = `Donation Confirmation - Christ Embassy Dunwoody`;
        const text = `Hello ${payload.name || 'Member'},\n
         Thank you for your donation of ${(payload.amount / 100).toFixed(2)} ${payload.currency || ''}.
         Reference: ${payload.reference}

         God bless you.
         - Christ Embassy Dunwoody
        `

        await this.addMailJob({
            to: payload.to,
            subject,
            text
        })
       
    }

}
