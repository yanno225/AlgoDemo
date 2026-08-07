import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateValeurIndicateurDto {
  @ApiProperty({
    description: "UUID de l'indicateur mesuré",
    format: 'uuid',
  })
  @IsUUID('4', { message: 'indicateurId doit être un UUID valide' })
  indicateurId!: string;

  @ApiProperty({
    description: 'Valeur numérique mesurée',
    example: 66.8,
  })
  @IsNumber({}, { message: 'valeur doit être un nombre' })
  valeur!: number;

  @ApiProperty({
    description: 'Date de la mesure (format AAAA-MM-JJ)',
    example: '2024-01-01',
  })
  @IsDateString(
    {},
    { message: 'dateMesure doit être une date au format AAAA-MM-JJ' },
  )
  dateMesure!: string;

  @ApiProperty({
    description: 'Pays ou zone concernée',
    example: "Côte d'Ivoire",
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'paysOuZone est obligatoire' })
  @MaxLength(100)
  paysOuZone!: string;

  @ApiProperty({
    description: 'Source de la donnée (traçabilité)',
    example: 'Ministère de l’Éducation nationale — annuaire statistique 2024',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty({ message: 'source est obligatoire' })
  @MaxLength(500)
  source!: string;
}
