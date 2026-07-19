import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateIndicateurDto {
  @ApiProperty({
    description: "Libellé de l'indicateur",
    example: 'Taux de scolarisation femme/homme',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty({ message: 'Le libellé est obligatoire' })
  @MaxLength(500)
  libelle!: string;

  @ApiProperty({
    description: 'UUID du critère de rattachement',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'critereId doit être un UUID valide' })
  critereId!: string;
}
