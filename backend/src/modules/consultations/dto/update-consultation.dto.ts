import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateConsultationDto } from './create-consultation.dto';

/**
 * Tous les champs de la création sauf `options`, rendus optionnels.
 * Les options de vote ne sont pas modifiables après création (intégrité des votes).
 */
export class UpdateConsultationDto extends PartialType(
  OmitType(CreateConsultationDto, ['options'] as const),
) {}
