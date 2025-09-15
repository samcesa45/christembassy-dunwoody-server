import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PaystackService } from 'src/paystack/paystack.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { randomBytes } from 'crypto';
import { MailService } from 'src/mail/mail.service';
import { toSlug } from './utils';


@Injectable()
export class DonationsService {
    private readonly logger = new Logger(DonationsService.name);

    constructor (
        private readonly prisma: PrismaService,
        private readonly paystack: PaystackService,
        private readonly mailQueue: MailService
    ) {}

    /**
     * Initiate Donation:
     * -create/updates donor
     * -creates donation record (PENDING)
     * -calls Paystack initialize endpoint
     * -returns authorization URL and donation record
     */
   
    async initiateDonation(dto: CreateDonationDto) {
        // donor (must provide email)
        if(!dto.email) throw new BadRequestException('Email is required');

        //upsert donor by email if provided , else create anonymous donor entry with unique uuid
        const donor = await this.prisma.donor.upsert({
            where: {email: dto.email},
            create: {
                name: dto.name,
                email: dto.email,
                phone: dto.phoneNumber ?? ''
            },
            update: {
                name: dto.name,
                phone: dto.phoneNumber ?? ''
            }
        });

        //currency fallback and lookup 
        const currencyCode = dto.currency ?? 'NGN';
        const currency = await this.prisma.currency.findUnique({where: {code: currencyCode}});
        if(!currency) throw new BadRequestException('Unsupported currency');
        

        // optional category
        let categoryId:number | null  = null;
        if(dto.category){
            const categorySlug = toSlug(dto.category)
           const  category = await this.prisma.category.findUnique({where: {slug: categorySlug}})
           if (!category) throw new BadRequestException('Invalid category');
            categoryId = category.id;
        }

        //unique reference
        const reference = `don-${Date.now()}-${randomBytes(4).toString('hex')}`;

        //create donation record (amount stored in minor unit)
        const donation = await this.prisma.donation.create({
            data: {
                donorId: donor.id,
                categoryId,
                currencyId: currency.id,
                amount: Math.round(dto.amount * 100), //convert to minor unit
                reference,
                status: 'PENDING',
                metadata: {source: 'api'}
            }
        });

        //call Paystack initialize
        const init = await this.paystack.initializePayment({
            email: dto.email ?? 'no-reply@church.org',
            amount: donation.amount,
            reference,
            metadata: {donationId: donation.id, donorId: donor.id},
            callback_url: `${process.env.CORS_ORIGIN}/donate/callback`,
        });

        //store authorization url
        const authorizationUrl = init?.data?.authorization_url ?? null;
        await this.prisma.donation.update({
            where:{id: donation.id},
            data: {authorizationUrl},
        });

        return {donation, authorizationUrl, paystackInit: init};
       
    }

    /**
     * findByReference 
     */
    async findByReference(reference:string) {
        const donation = await this.prisma.donation.findUnique({
            where: {reference},
            include: {
                donor: true,
                category: true,
                currency: true,
                transactions: true
            }
        })

        if(!donation) {
            throw new NotFoundException('Donation not found')
        }
        return donation;
    }
     /**
         * Verify donation by reference: call paystack verify, create transaction, update donation status,
         * enqueue email confirmation when success.
         */

     async verifyDonationDto(reference: string) {
        const resp = await this.paystack.verifyTransaction(reference);
        if( !resp) throw new BadRequestException("Empty response from provider");

        if(!resp.status) {
            //paystack returned status:false - forward details
            throw new BadRequestException(resp.message || 'Verification failed');

        }

        const data = resp.data;
        const donation = await this.prisma.donation.findUnique({where: {reference: data.reference}})
        if(!donation) throw new NotFoundException('Donation not found');

        //Idempotent: check existing transaction 
        const exists = await this.prisma.paymentTransaction.findFirst({
            where: {providerRef: data.reference, provider:'paystack'}
        });

        if(!exists) {
            await this.prisma.paymentTransaction.create({
                data: {
                    donationId: donation.id,
                    provider: 'paystack',
                    providerRef: data.reference,
                    amount: data.amount,
                    status: data.status,
                    rawResponse: resp,
                    providerTxnId: data.id.toString(), 
                    gatewayResponse: data.gateway_response,
                }
            })
        }

        //update donation status 
        const newStatus = data.status === 'success' ? 'SUCCESS' : data.status === 'failed' ? 'FAILED' : donation.status;
        await this.prisma.donation.update({
            where: {id: donation.id},
            data: {status: newStatus}
        });

        //enqueue confirmation email on success (non-blocking)
        if (data.status === 'success') {
            //fetch fresh donor data 
            const donor = await this.prisma.donor.findUnique({where: {id: donation.donorId}});
            await this.mailQueue.enqueueDonationSuccess({
                to: donor?.email ?? undefined,
                name: donor?.name ?? 'Member',
                amount: data.amount /100,
                currency: donation.currencyId ? (await this.prisma.currency.findUnique({where: {id: donation.currencyId}}))?.code : "NGN",
                reference: data.reference
            })
            
        }

        return resp;
     }

     /**
      * List donations with pagination and filters for admin
      */
     async listDonations(opts: {
        page: number;
        perPage: number;
        status?: string;
        donorEmail?: string;
        categorySlug?: string;
     }) {
        const {page, perPage, status, donorEmail, categorySlug} = opts
        const where: any = {}

        if(status) where.status = status.toUpperCase();
        if(donorEmail) where.donor = {email: {contains: donorEmail}}
        if(categorySlug) {
            const cat = await this.prisma.category.findUnique({where: {slug: categorySlug}});
            if(!cat) throw new BadRequestException('Invalid category filter');
            where.categoryId = cat.id;
        }

        const [items, total] = await Promise.all([this.prisma.donation.findMany({
            where,
            orderBy: {createdAt: 'desc'},
            include: {donor: true, category: true, currency: true},
            skip: (page - 1) * perPage,
            take: perPage,
        }),
        this.prisma.donation.count({where})
    ]);
    return {
        data: items,
        meta: {page, perPage, total, pages: Math.ceil(total / perPage)}
    }
     }

     async findByUuid(uuid: string) {
        return this.prisma.donation.findFirst({
            where: {uuid},
            include: {donor: true, category: true, currency: true, transactions: true}
        })
     }
}
