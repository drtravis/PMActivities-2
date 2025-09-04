import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const errorResponse = exception.getResponse();
    const message = typeof errorResponse === 'string' 
      ? errorResponse 
      : (errorResponse as any).message || 'Internal server error';

    // Log security-related errors
    if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
      this.logger.warn(
        `Security violation: ${status} ${message} - IP: ${request.ip} - User-Agent: ${request.get('User-Agent')} - Path: ${request.path}`,
      );
    }

    // Log all server errors
    if (status >= 500) {
      this.logger.error(
        `Server error: ${status} ${message} - Path: ${request.path}`,
        exception.stack,
      );
    }

    const errorDetails = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: process.env.NODE_ENV === 'production' && status >= 500 
        ? 'Internal server error' 
        : message,
    };

    // Don't expose sensitive information in production
    if (process.env.NODE_ENV !== 'production') {
      (errorDetails as any).stack = exception.stack;
    }

    response.status(status).json(errorDetails);
  }
}
