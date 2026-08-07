import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/** ADMIN : bloquer / débloquer un compte (§9.3) */
export class BloquerCompteDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  bloque!: boolean;
}
