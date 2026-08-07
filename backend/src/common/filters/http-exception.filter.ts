import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filtre d'exceptions global : garantit un format d'erreur JSON homogène
 * sur toute l'API et journalise les erreurs (warn pour 4xx, error pour 5xx).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Les détails d'une erreur interne ne sont jamais exposés au client
    const payload =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Erreur interne du serveur';

    const message = `${request.method} ${request.url} → ${status}`;
    if (status >= 500) {
      this.logger.error(
        message,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(message);
    }

    response.status(status).json({
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      ...(typeof payload === 'string' ? { message: payload } : payload),
    });
  }
}
