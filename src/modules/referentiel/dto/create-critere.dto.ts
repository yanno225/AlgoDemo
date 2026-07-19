import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCritereDto {
  @ApiProperty({
    description: 'Libellé du critère',
    example: 'Égalité et inclusion sociale',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: 'Le libellé est obligatoire' })
  @MaxLength(255)
  libelle!: string;

  @ApiProperty({
    description: 'UUID de la thématique de rattachement',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'thematiqueId doit être un UUID valide' })
  thematiqueId!: string;
}
