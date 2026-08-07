import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreerAffirmationDto {
  @ApiProperty({
    description: 'Affirmation soumise au vote en direct de la salle',
    example: 'Le taux de participation des jeunes a doublé depuis 2020.',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty({ message: 'Le texte est obligatoire' })
  @MaxLength(500)
  texte!: string;
}
