import { PartialType } from '@nestjs/swagger';
import { CreateCritereDto } from './create-critere.dto';

/** Tous les champs de la création, rendus optionnels (permet aussi de re-rattacher le critère) */
export class UpdateCritereDto extends PartialType(CreateCritereDto) {}
