import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'utilisateur@example.com' })
  @IsEmail({}, { message: "L'email doit être valide" })
  email!: string;

  @ApiProperty({
    example: 'MotDePasse123',
    description: 'Au moins 8 caractères, une lettre et un chiffre',
  })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  @MaxLength(72)
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'Le mot de passe doit contenir au moins une lettre et un chiffre',
  })
  motDePasse!: string;

  @ApiProperty({ example: 'Traoré' })
  @IsString()
  @MaxLength(100)
  nom!: string;

  @ApiProperty({ example: 'Aïcha' })
  @IsString()
  @MaxLength(100)
  prenom!: string;

  @ApiProperty({ example: '+2250700000000', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telephone?: string;
}
