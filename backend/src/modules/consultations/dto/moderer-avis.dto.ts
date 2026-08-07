import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ModererAvisDto {
  @ApiProperty({ enum: ['APPROUVE', 'REJETE'] })
  @IsIn(['APPROUVE', 'REJETE'])
  decision!: 'APPROUVE' | 'REJETE';

  @ApiProperty({ required: false, description: 'Motif (recommandé en cas de rejet)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motif?: string;
}
