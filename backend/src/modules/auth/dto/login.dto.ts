import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'utilisateur@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  motDePasse!: string;

  @ApiProperty({
    required: false,
    description: 'Code TOTP à 6 chiffres — requis uniquement si la 2FA est activée sur le compte',
    example: '123456',
  })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  codeOtp?: string;
}
