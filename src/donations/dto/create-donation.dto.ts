import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString } from "class-validator";

export enum Currency {
    USD = "USD",
    EUR = "EUR",
    CAD = "CAD",
    GBP = "GBP",
    GHS = "GHS",
    NGN = "NGN",
}

export enum GivingCategory {
    GENERAL_OFFERING = "General Offering",
    SPECIAL_SEED = "Special Seed",
    GLOBAL_SERVICE_SPONSORSHIP = "Global Service Sponsorship",
    SAVE_A_LIFE_CAMPAIGN = "Save a Life Campaign",
    GLOBAL_OUTREACH = "Global Outreach",
}

export class CreateDonationDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    phoneNumber: string;

    @IsNumber()
    @IsPositive()
    amount: number;

    @IsEnum(Currency)
    currency: Currency;

    @IsEnum(GivingCategory)
    category: GivingCategory;
}