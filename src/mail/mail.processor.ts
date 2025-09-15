import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import nodemailer from 'nodemailer'

@Processor('mail-queue')
export class MailProcessor extends WorkerHost {
    async process(job: Job<any, any, string>) {
       if(job.name === 'sendMail') {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '2525', 10),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            }
        });

        await transporter.sendMail({
            from: process.env.MAIL_FROM,
            to: job.data.to,
            subject: job.data.subject,
            text: job.data.text
        });

        console.log(`Email sent to ${job.data.to}`)
       }
    }
}