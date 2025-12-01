import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Erreur interne du serveur';

    const errorResponse = {
      success: false,
      message:
        typeof message === 'string'
          ? message
          : (message as any).message || 'Erreur interne du serveur',
      error:
        exception instanceof HttpException
          ? exception.name
          : 'InternalServerError',
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Logger l'erreur avec plus de détails
    if (exception instanceof Error) {
      this.logger.error(
        `Erreur ${status} sur ${request.method} ${request.url}`,
        exception.stack || exception.message,
      );
      this.logger.error('Détails de l\'erreur:', {
        message: exception.message,
        name: exception.name,
        stack: exception.stack,
      });
    } else {
      this.logger.error(
        `Erreur ${status} sur ${request.method} ${request.url}`,
        JSON.stringify(exception, null, 2),
      );
    }

    response.status(status).json(errorResponse);
  }
}
