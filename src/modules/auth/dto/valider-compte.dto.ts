import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/** ADMIN : valider / invalider un compte (§9.3) */
export class ValiderCompteDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  valide!: boolean;
}
