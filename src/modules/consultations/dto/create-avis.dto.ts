import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAvisDto {
  @ApiProperty({ description: 'Texte libre de l’avis citoyen' })
  @IsString()
  @IsNotEmpty({ message: "Le texte de l'avis est obligatoire" })
  @MaxLength(5000)
  texte!: string;

  @ApiProperty({ description: 'Thématique de rattachement (Référentiel)' })
  @IsUUID()
  thematiqueId!: string;
}
