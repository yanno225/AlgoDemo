import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { StatutVerification } from '../enums/statut-verification.enum';
import { TypeContenu } from '../enums/type-contenu.enum';

export class CreateContenuDto {
  @ApiProperty({ maxLength: 255 })
  @IsString()
  @IsNotEmpty({ message: 'Le titre est obligatoire' })
  @MaxLength(255)
  titre!: string;

  @ApiProperty({ description: 'Corps textuel — support de la lecture audio TTS' })
  @IsString()
  @IsNotEmpty({ message: 'Le corps est obligatoire' })
  corps!: string;

  @ApiProperty({ enum: TypeContenu })
  @IsEnum(TypeContenu)
  type!: TypeContenu;

  @ApiProperty({ description: 'Identifiant de la thématique de rattachement (Référentiel)' })
  @IsUUID()
  thematiqueId!: string;

  @ApiProperty({ enum: StatutVerification, required: false })
  @IsOptional()
  @IsEnum(StatutVerification)
  statutVerification?: StatutVerification;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  estOfficiel?: boolean;

  @ApiProperty({ required: false, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  source?: string;

  @ApiProperty({ required: false, maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  urlMedia?: string;

  @ApiProperty({
    required: false,
    default: false,
    description: 'Inclure ce contenu dans le package hors-ligne (§9.4)',
  })
  @IsOptional()
  @IsBoolean()
  telechargeable?: boolean;
}
