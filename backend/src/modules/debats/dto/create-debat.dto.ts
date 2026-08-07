import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateDebatDto {
  @ApiProperty({
    description: 'Titre du débat',
    example: 'La participation des jeunes aux élections de 2026',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'Le titre est obligatoire' })
  @MaxLength(255)
  titre!: string;

  @ApiPropertyOptional({ description: 'Description / ordre du jour' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'UUID de la thématique de rattachement (Référentiel)',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'thematiqueId doit être un UUID valide' })
  thematiqueId!: string;

  @ApiProperty({
    description: 'Date/heure planifiée du live (ISO 8601)',
    example: '2026-07-25T18:00:00Z',
  })
  @IsDateString(
    {},
    { message: 'dateDebut doit être une date ISO 8601 (ex. 2026-07-25T18:00:00Z)' },
  )
  dateDebut!: string;

  @ApiPropertyOptional({
    description: 'UUID du compte désigné modérateur (point focal/admin)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'moderateurId doit être un UUID valide' })
  moderateurId?: string;
}
