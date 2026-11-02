import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { Request, Response } from 'express';

// @Catch() means this filter can catch any exception.
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Gives us access to the HTTP request and response.
      console.error('FULL BACKEND ERROR:', exception);

    const httpContext = host.switchToHttp();

    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    // If this is a NestJS HTTP exception, use its status code.
    // Otherwise, treat it as an internal server error (500).
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Get the original exception response.
    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : null;

    // Extract a useful error message.
    let message = 'Internal server error';

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const errorMessage = exceptionResponse.message;

      // Some NestJS validation errors return an array of messages.
      message = Array.isArray(errorMessage)
        ? errorMessage.join(', ')
        : String(errorMessage);
    }

    // Send our own consistent JSON response.
    response.status(statusCode).json({
      success: false,
      statusCode: statusCode,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    });
  }
}