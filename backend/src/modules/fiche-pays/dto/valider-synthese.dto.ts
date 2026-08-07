import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ValiderSyntheseDto {
  @ApiPropertyOptional({
    description:
      "Texte corrigé par l'admin. Si absent, le texte généré par l'IA est publié tel quel.",
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'texteCorrige ne peut pas être vide s’il est fourni' })
  texteCorrige?: string;
}
