import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { CategorieSignalement } from '../enums/signalement-citoyen.enums';

export class CreateSignalementCitoyenDto {
  @ApiProperty({ enum: CategorieSignalement })
  @IsEnum(CategorieSignalement)
  categorie!: CategorieSignalement;

  @ApiProperty({ description: 'Description du constat' })
  @IsString()
  @IsNotEmpty({ message: 'La description est obligatoire' })
  @MaxLength(2000)
  description!: string;

  @ApiProperty({ description: 'Adresse lisible du constat' })
  @IsString()
  @IsNotEmpty({ message: "L'adresse est obligatoire" })
  @MaxLength(300)
  adresse!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({ description: 'URL MinIO de la photo (POST /media/upload)' })
  @IsOptional()
  @IsUrl({ require_tld: false }, { message: "urlPhoto doit être une URL valide" })
  @MaxLength(1000)
  urlPhoto?: string;
}
