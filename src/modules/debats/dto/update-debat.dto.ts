import { PartialType } from '@nestjs/swagger';
import { CreateDebatDto } from './create-debat.dto';

/** Tous les champs de la création, rendus optionnels */
export class UpdateDebatDto extends PartialType(CreateDebatDto) {}
