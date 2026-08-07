import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBooleanString,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { StatutVerification } from '../enums/statut-verification.enum';
import { TypeContenu } from '../enums/type-contenu.enum';

const TAILLE_PAGE_DEFAUT = 20;
const TAILLE_PAGE_MAX = 100;

/** Filtres, recherche, tri et pagination de GET /feed (CDC §6.2, §9.4) */
export class QueryFeedDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: TAILLE_PAGE_DEFAUT, maximum: TAILLE_PAGE_MAX })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(TAILLE_PAGE_MAX)
  limite: number = TAILLE_PAGE_DEFAUT;

  @ApiPropertyOptional({ description: 'Recherche mot-clé (titre / corps)' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  thematiqueId?: string;

  @ApiPropertyOptional({ enum: TypeContenu })
  @IsOptional()
  @IsEnum(TypeContenu)
  type?: TypeContenu;

  @ApiPropertyOptional({ enum: StatutVerification })
  @IsOptional()
  @IsEnum(StatutVerification)
  statutVerification?: StatutVerification;

  @ApiPropertyOptional({ description: 'Contenus publiés à partir de cette date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @ApiPropertyOptional({ description: "Contenus publiés jusqu'à cette date (ISO 8601)" })
  @IsOptional()
  @IsDateString()
  dateFin?: string;

  @ApiPropertyOptional({ enum: ['date', 'pertinence'], default: 'date' })
  @IsOptional()
  @IsIn(['date', 'pertinence'])
  tri: 'date' | 'pertinence' = 'date';

  @ApiPropertyOptional({ description: 'Filtrer sur le contenu marqué téléchargeable (hors-ligne)' })
  @IsOptional()
  @IsBooleanString()
  telechargeable?: string;
}
