import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

/** RGPD (§9.3) : consentement notifications + acceptation politique de confidentialité */
export class UpdateConsentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  consentementNotifications?: boolean;

  @ApiProperty({
    required: false,
    description: 'true pour accepter la politique de confidentialité',
  })
  @IsOptional()
  @IsBoolean()
  politiqueConfidentialiteAcceptee?: boolean;
}
