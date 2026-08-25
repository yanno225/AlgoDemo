import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional } from 'class-validator';
import { TypeConsultation } from '../enums/type-consultation.enum';

export class QueryConsultationsDto {
  @ApiPropertyOptional({ enum: ['ouvertes', 'cloturees', 'toutes'], default: 'toutes' })
  @IsOptional()
  @IsIn(['ouvertes', 'cloturees', 'toutes'])
  statut: 'ouvertes' | 'cloturees' | 'toutes' = 'toutes';

  /** Sans filtre : les deux types confondus (rétro-compatible). */
  @ApiPropertyOptional({ enum: TypeConsultation })
  @IsOptional()
  @IsEnum(TypeConsultation)
  type?: TypeConsultation;
}
