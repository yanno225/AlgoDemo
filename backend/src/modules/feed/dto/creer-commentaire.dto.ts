import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreerCommentaireDto {
  @ApiPropertyOptional({
    description: 'Commentaire auquel on répond (fil à un niveau)',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({
    description: 'Texte du commentaire',
    maxLength: 500,
    example: 'Très éclairant, merci pour les sources.',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le commentaire ne peut pas être vide' })
  @MaxLength(500, {
    message: 'Un commentaire ne dépasse pas 500 caractères',
  })
  texte!: string;
}
