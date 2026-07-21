import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class GenererSyntheseDto {
  @ApiProperty({
    description: 'UUID de la thématique à synthétiser',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'thematiqueId doit être un UUID valide' })
  thematiqueId!: string;

  @ApiProperty({
    description: 'Pays ou zone concernée',
    example: "Côte d'Ivoire",
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'paysOuZone est obligatoire' })
  @MaxLength(100)
  paysOuZone!: string;
}
