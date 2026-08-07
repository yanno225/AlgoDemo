import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

export class DefinirReplayDto {
  @ApiProperty({
    description: "URL d'archive/replay du débat terminé",
    example: 'https://media.algodemo.org/replays/debat-2026-07-25.mp4',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl({}, { message: 'urlReplay doit être une URL valide' })
  @MaxLength(500)
  urlReplay!: string;
}
