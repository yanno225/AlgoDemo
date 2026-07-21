import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class TraiterSignalementDto {
  @ApiProperty({
    enum: ['DEPUBLIER', 'IGNORER'],
    description: 'DEPUBLIER dépublie le contenu signalé ; IGNORER clôt le signalement sans action',
  })
  @IsIn(['DEPUBLIER', 'IGNORER'])
  action!: 'DEPUBLIER' | 'IGNORER';
}
