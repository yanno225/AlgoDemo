import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { StatutSignalementCitoyen } from '../enums/signalement-citoyen.enums';

export class ChangerStatutSignalementDto {
  @ApiProperty({ enum: StatutSignalementCitoyen })
  @IsEnum(StatutSignalementCitoyen)
  statut!: StatutSignalementCitoyen;
}
