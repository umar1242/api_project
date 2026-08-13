import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

/**
 * Global exception filter.
 * Produces a uniform error envelope for all HTTP responses:
 * { statusCode, path, timestamp, error }
 *
 * Unexpected non-HTTP errors are masked as 500 (never leak internals).
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number;
    let errorBody: unknown;

    if (exception instanceof HttpException) { this.logger.error(`HTTP ${exception.getStatus()} on ${request.method} ${request.url}`, JSON.stringify(exception.getResponse()));
      statusCode = exception.getStatus();
      errorBody = exception.getResponse();
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      errorBody = "Internal server error";
      // Log unexpected errors with full stack
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(statusCode).json({
      statusCode,
      path: request.url,
      timestamp: new Date().toISOString(),
      error: errorBody,
    });
  }
}
