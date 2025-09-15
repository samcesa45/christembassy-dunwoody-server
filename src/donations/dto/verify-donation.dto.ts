import { IsNotEmpty, IsString } from "class-validator";

export class verifyDonationDto {
    @IsString()
    @IsNotEmpty()
    reference: string;
}