import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class Verify2FaDto {
  @ApiProperty({ example: '123456', description: 'Code TOTP à 6 chiffres' })
  @IsString()
  @Length(6, 6)
  code!: string;
}
