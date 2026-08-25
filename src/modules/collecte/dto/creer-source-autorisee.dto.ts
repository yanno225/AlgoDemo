import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreerSourceAutoriseeDto {
  @ApiProperty({
    description: 'Nom officiel de la source',
    example: 'Banque Mondiale',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'Le libellé est obligatoire' })
  @MaxLength(255)
  libelle!: string;

  @ApiPropertyOptional({
    description: 'Domaine web de la source (sans protocole)',
    example: 'worldbank.org',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  domaine?: string;

  @ApiPropertyOptional({
    description: 'Description libre (périmètre, fiabilité)',
  })
  @IsOptional()
  @IsString()
  description?: string;
}

export class ModifierSourceAutoriseeDto extends PartialType(
  CreerSourceAutoriseeDto,
) {
  @ApiPropertyOptional({
    description: "Désactiver une source bloque l'ingestion sans la supprimer",
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
