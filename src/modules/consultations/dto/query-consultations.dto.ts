import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class QueryConsultationsDto {
  @ApiPropertyOptional({ enum: ['ouvertes', 'cloturees', 'toutes'], default: 'toutes' })
  @IsOptional()
  @IsIn(['ouvertes', 'cloturees', 'toutes'])
  statut: 'ouvertes' | 'cloturees' | 'toutes' = 'toutes';
}
