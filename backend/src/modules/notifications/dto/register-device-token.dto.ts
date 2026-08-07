import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength } from 'class-validator';
import { Plateforme } from '../enums/plateforme.enum';

export class RegisterDeviceTokenDto {
  @ApiProperty({ description: "Token FCM/APNs de l'appareil" })
  @IsString()
  @MaxLength(500)
  token!: string;

  @ApiProperty({ enum: Plateforme })
  @IsEnum(Plateforme)
  plateforme!: Plateforme;
}
