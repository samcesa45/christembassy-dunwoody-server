import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { CreateDonationDto } from './dto/create-donation.dto';

@Controller('donations')
export class DonationsController {
    constructor(private readonly donationsService: DonationsService) {}

    @Post("initiate")
    initiate(@Body() dto:CreateDonationDto) {
        return this.donationsService.initiateDonation(dto);
    }

    @Post("verify/:reference")
    verify(@Param("reference") reference: string) {
        return this.donationsService.verifyDonationDto(reference);
    }

    @Get()
    list(
        @Query("page") page = 1,
    @Query("perPage") perPage = 10,
    @Query('status') status?: string,
    @Query('donorEmail') donorEmail?: string,
    @Query('category') categorySlug?: string,

    ){
        return this.donationsService.listDonations({
            page: Number(page),
            perPage: Number(perPage),
            status,
            donorEmail,
            categorySlug
        })
    }

    @Get(":uuid")
    findOne(@Param("uuid") uuid: string) {
        return this.donationsService.findByUuid(uuid);
    }

    @Get('by-reference/:reference')
    async findByRefrence(@Param('reference') reference: string) {
        return this.donationsService.findByReference(reference);
    }
}
