import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

/**
 * Vote unique sécurisé — 1 vote par utilisateur et par consultation.
 * La 2FA (codeOtp) est désactivée en v1 (choix produit) ; le champ reste
 * accepté mais optionnel, pour réactiver la vérification sans casser le contrat.
 */
export class VoteDto {
  @ApiProperty({ description: "Identifiant de l'option choisie" })
  @IsUUID()
  optionId!: string;

  @ApiPropertyOptional({
    example: '123456',
    description: 'Code TOTP à 6 chiffres (2FA — non requis en v1)',
  })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  codeOtp?: string;
}
