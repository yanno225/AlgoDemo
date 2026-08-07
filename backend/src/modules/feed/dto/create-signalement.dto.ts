import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSignalementDto {
  @ApiProperty({ description: 'Motif du signalement (ex. fausse information, contenu inapproprié)' })
  @IsString()
  @IsNotEmpty({ message: 'Le motif est obligatoire' })
  @MaxLength(1000)
  motif!: string;
}
