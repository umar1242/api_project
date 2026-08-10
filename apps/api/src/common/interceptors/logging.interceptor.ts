import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

/**
 * Logs every incoming request and its response time.
 * Attaches a unique correlation ID (X-Request-Id) to each request
 * so logs can be traced across bot → API calls.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    // Attach correlation ID
    const requestId = (req.headers["x-request-id"] as string) ?? uuidv4();
    res.setHeader("X-Request-Id", requestId);

    const { method, url } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          this.logger.log(
            `[${requestId}] ${method} ${url} ${res.statusCode} +${ms}ms`,
          );
        },
        error: () => {
          const ms = Date.now() - start;
          this.logger.warn(`[${requestId}] ${method} ${url} ERROR +${ms}ms`);
        },
      }),
    );
  }
}
