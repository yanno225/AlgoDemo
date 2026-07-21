import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class IngererTexteDto {
  @ApiProperty({
    description: "Texte brut à analyser (article, rapport, page scrapée)",
  })
  @IsString()
  @IsNotEmpty({ message: 'Le texte est obligatoire' })
  texte!: string;

  @ApiProperty({
    description: 'Provenance du texte (URL ou intitulé de la source)',
    example: 'https://www.ins.ci/rapport-2024',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  source!: string;

  @ApiPropertyOptional({
    description: 'Pays ou zone concernée',
    example: "Côte d'Ivoire",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  paysOuZone?: string;
}
