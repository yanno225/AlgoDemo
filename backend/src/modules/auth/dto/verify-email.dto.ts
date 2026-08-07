import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ example: 'utilisateur@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '482913', description: 'Code OTP reçu par email/SMS' })
  @IsString()
  @Length(6, 6)
  code!: string;
}
