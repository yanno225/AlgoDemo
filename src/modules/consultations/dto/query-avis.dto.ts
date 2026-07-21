import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class QueryAvisDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  thematiqueId?: string;
}
