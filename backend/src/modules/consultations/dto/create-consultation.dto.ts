import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateConsultationDto {
  @ApiProperty({ maxLength: 255 })
  @IsString()
  @IsNotEmpty({ message: 'Le titre est obligatoire' })
  @MaxLength(255)
  titre!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'La description est obligatoire' })
  description!: string;

  @ApiProperty({ description: 'Vulgarisation du projet de loi/texte soumis à consultation' })
  @IsString()
  @IsNotEmpty({ message: 'Le résumé vulgarisé est obligatoire' })
  resumeVulgarise!: string;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z' })
  @IsDateString()
  dateOuverture!: string;

  @ApiProperty({ example: '2026-08-15T00:00:00.000Z' })
  @IsDateString()
  dateCloture!: string;

  @ApiProperty({
    type: [String],
    example: ['Pour', 'Contre', 'Abstention'],
    description: 'Libellés des options de vote (au moins 2)',
  })
  @IsArray()
  @ArrayMinSize(2, { message: 'Au moins 2 options de vote sont requises' })
  @IsString({ each: true })
  options!: string[];
}
