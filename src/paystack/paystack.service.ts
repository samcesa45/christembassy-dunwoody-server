import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly baseUrl = 'https://api.paystack.co';
  private readonly secretKey: string;
  private readonly publicKey: string;
  private readonly webhookSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY', '');
    this.publicKey = this.configService.get<string>('PAYSTACK_PUBLIC_KEY', '');
    this.webhookSecret = this.configService.get<string>('PAYSTACK_WEBHOOK_SECRET', '');
  }

  async initializePayment(payload: {
    email: string;
    amount: number;
    reference: string;
    callback_url?: string;
    metadata?: Record<string, any>;
  }) {
    const res = await axios.post(
      `${this.baseUrl}/transaction/initialize`,
      payload,
      { headers: { Authorization: `Bearer ${this.secretKey}` } }
    );
    return res.data;
  }

  async verifyTransaction(reference: string) {
    const res = await axios.get(
      `${this.baseUrl}/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${this.secretKey}` } }
    );
    return res.data;
  }

  verifyWebhookSignature(rawBody: string, signature: string) {
    if (!this.webhookSecret || !signature) return false;
    const hash = crypto.createHmac('sha512', this.webhookSecret).update(rawBody).digest('hex');
    return hash === signature;
  }
}
