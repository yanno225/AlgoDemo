import { PartialType } from '@nestjs/swagger';
import { CreateThematiqueDto } from './create-thematique.dto';

/** Tous les champs de la création, rendus optionnels */
export class UpdateThematiqueDto extends PartialType(CreateThematiqueDto) {}
