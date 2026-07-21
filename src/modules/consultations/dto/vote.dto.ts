import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, Length } from 'class-validator';

/** Vote unique sécurisé — 2FA obligatoire (CDC §6.3) */
export class VoteDto {
  @ApiProperty({ description: "Identifiant de l'option choisie" })
  @IsUUID()
  optionId!: string;

  @ApiProperty({ example: '123456', description: 'Code TOTP à 6 chiffres (2FA obligatoire pour voter)' })
  @IsString()
  @Length(6, 6)
  codeOtp!: string;
}
