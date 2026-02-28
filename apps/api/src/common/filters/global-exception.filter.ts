import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { captureException } from "../monitoring/sentry";

type ErrorResponseBody = {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
  };
  meta: {
    requestId?: string;
    timestamp: string;
    path: string;
  };
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const path = request.originalUrl ?? request.url;
    const requestId = request.requestId;

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let code = "INTERNAL_SERVER_ERROR";

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      code = HttpStatus[statusCode] ?? "HTTP_EXCEPTION";

      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === "object" && exceptionResponse) {
        const payload = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };
        if (Array.isArray(payload.message)) {
          message = payload.message.join(", ");
        } else if (typeof payload.message === "string") {
          message = payload.message;
        }
        if (payload.error) {
          code = payload.error.toUpperCase().replace(/\s+/g, "_");
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    captureException(exception);
    this.logger.error(
      JSON.stringify({
        event: "exception_caught",
        requestId,
        path,
        statusCode,
        code,
        message,
      }),
      exception instanceof Error ? exception.stack : undefined,
    );

    const responseBody: ErrorResponseBody = {
      success: false,
      error: {
        code,
        message,
        statusCode,
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        path,
      },
    };

    response.status(statusCode).json(responseBody);
  }
}
