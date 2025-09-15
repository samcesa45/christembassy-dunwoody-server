import {
    Controller,
    Headers,
    Logger,
    Post,
    Req,
    Res,
  } from '@nestjs/common';
  import type { Request, Response } from 'express';
  import { PaystackService } from 'src/paystack/paystack.service';
  import { PrismaService } from 'src/prisma/prisma.service';
  import { MailService } from 'src/mail/mail.service';
  
  @Controller('webhooks')
  export class WebhooksController {
    private readonly logger = new Logger(WebhooksController.name);
  
    constructor(
      private readonly paystack: PaystackService,
      private readonly prisma: PrismaService,
      private readonly mailService: MailService,
    ) {}
  
    @Post('paystack')
    async handlePaystack(
      @Req() req: Request,
      @Res() res: Response,
      @Headers('x-paystack-signature') signature: string,
    ) {
      const rawBody = (req as any).rawBody ?? JSON.stringify(req.body);
  
      // verify signature
      if (!this.paystack.verifyWebhookSignature(rawBody, signature)) {
        this.logger.warn('Invalid Paystack signature');
        return res.status(400).send('Invalid signature');
      }
  
      const event = req.body;
      this.logger.debug(`Received Paystack event: ${event?.event}`);
  
      try {
        if (
          event.event === 'charge.success' ||
          event.event === 'transaction.success'
        ) {
          const data = event.data;
          const reference = data.reference;
  
          // Find related donation, including donor relation
          const donation = await this.prisma.donation.findUnique({
            where: { reference },
            include: { donor: true },
          });
  
          if (!donation) {
            this.logger.warn(`Donation not found for reference ${reference}`);
            return res.status(200).send('ok'); 
          }
  
          // Check if transaction already stored
          const exists = await this.prisma.paymentTransaction.findFirst({
            where: { providerRef: reference, provider: 'paystack' },
          });
  
          if (!exists) {
            await this.prisma.paymentTransaction.create({
              data: {
                donationId: donation.id,
                provider: 'paystack',
                providerRef: reference,
                providerTxnId: String(data.id), // Paystack txn ID
                amount: data.amount / 100, // kobo -> NGN
                status: data.status,
                gatewayResponse: data.gateway_response,
                rawResponse: event,
              },
            });
          }
  
          // Update donation + send mail only if SUCCESS
          if (data.status === 'success') {
            await this.prisma.donation.update({
              where: { id: donation.id },
              data: { status: 'SUCCESS' },
            });
  
            // Idempotent mail log check
            const mailSent = await this.prisma.mailLog.findFirst({
              where: { reference, type: 'DONATION_SUCCESS' },
            });
  
            if (!mailSent) {
              await this.mailService.enqueueDonationSuccess({
                to: donation.donor.email,
                name: donation.donor.name,
                amount: data.amount,
                currency: data.currency,
                reference,
              });
  
              await this.prisma.mailLog.create({
                data: { reference, type: 'DONATION_SUCCESS' },
              });
  
              this.logger.log(
                `Donation ${donation.id}: success mail enqueued for ${donation.donor.email}`,
              );
            }
          } else if (['failed', 'abandoned'].includes(data.status)) {
            await this.prisma.donation.update({
              where: { id: donation.id },
              data: { status: 'FAILED' },
            });
          } else {
            this.logger.log(
              `Donation ${donation.id} still in status ${data.status}, no update made`,
            );
          }
        } else {
          this.logger.log(`Unhandled Paystack event: ${event?.event}`);
        }
  
        return res.status(200).send('ok'); 
      } catch (err) {
        this.logger.error('Webhook processing error', err as any);
        return res.status(500).send('error');
      }
    }
  }
  