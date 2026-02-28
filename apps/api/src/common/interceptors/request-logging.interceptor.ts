import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Request } from "express";
import { Observable, tap } from "rxjs";

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - startedAt;
          this.logger.log(
            JSON.stringify({
              event: "request_completed",
              requestId: request.requestId,
              method: request.method,
              path: request.originalUrl ?? request.url,
              statusCode: response.statusCode,
              durationMs,
            }),
          );
        },
        error: (error: unknown) => {
          const durationMs = Date.now() - startedAt;
          this.logger.error(
            JSON.stringify({
              event: "request_failed",
              requestId: request.requestId,
              method: request.method,
              path: request.originalUrl ?? request.url,
              statusCode: response.statusCode,
              durationMs,
              message: error instanceof Error ? error.message : "Unknown error",
            }),
          );
        },
      }),
    );
  }
}
