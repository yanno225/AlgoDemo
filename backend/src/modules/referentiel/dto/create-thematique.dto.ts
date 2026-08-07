import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateThematiqueDto {
  @ApiProperty({
    description: 'Libellé de la thématique',
    example: 'Genre et Société',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'Le libellé est obligatoire' })
  @MaxLength(255)
  libelle!: string;
}
