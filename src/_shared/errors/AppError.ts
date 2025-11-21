/**
 * Custom application error class for consistent error handling
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: any,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
  }
}

/**
 * Common error factory functions for typical error scenarios
 */
export class ErrorFactory {
  static badRequest(message: string, code = 'BAD_REQUEST', details?: any) {
    return new AppError(400, code, message, details);
  }

  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED', details?: any) {
    return new AppError(401, code, message, details);
  }

  static forbidden(message = 'Forbidden', code = 'FORBIDDEN', details?: any) {
    return new AppError(403, code, message, details);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND', details?: any) {
    return new AppError(404, code, message, details);
  }

  static conflict(message: string, code = 'CONFLICT', details?: any) {
    return new AppError(409, code, message, details);
  }

  static unprocessableEntity(message: string, code = 'UNPROCESSABLE_ENTITY', details?: any) {
    return new AppError(422, code, message, details);
  }

  static validation(message = 'Validation failed', details?: any) {
    return new AppError(400, 'VALIDATION_ERROR', message, details);
  }

  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    return new AppError(500, code, message, undefined, false);
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}
