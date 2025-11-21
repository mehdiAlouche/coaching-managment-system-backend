import { Request, Response, NextFunction } from 'express';
import { AppError, isAppError } from '../_shared/errors/AppError';
import { HttpStatus } from '../_shared/enums/httpStatus';

/**
 * Error response interface for consistent API responses
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}

/**
 * Centralized error handler middleware
 * Should be registered as the last middleware in Express app
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error for debugging (in production, use proper logging service)
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error caught by error handler:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      ...(isAppError(err) && { code: err.code, statusCode: err.statusCode }),
    });
  }

  // Handle AppError instances
  if (isAppError(err)) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
        timestamp: new Date().toISOString(),
      },
    };

    res.status(err.statusCode).json(errorResponse);
    return;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: Object.values((err as any).errors || {}).map((e: any) => ({
          field: e.path,
          message: e.message,
        })),
        timestamp: new Date().toISOString(),
      },
    };

    res.status(HttpStatus.BAD_REQUEST).json(errorResponse);
    return;
  }

  // Handle Mongoose duplicate key errors
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern || {})[0] || 'field';
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'DUPLICATE_ERROR',
        message: `${field} already exists`,
        details: { field },
        timestamp: new Date().toISOString(),
      },
    };

    res.status(HttpStatus.CONFLICT).json(errorResponse);
    return;
  }

  // Handle Mongoose cast errors (invalid ObjectId)
  if (err.name === 'CastError') {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid ID format',
        timestamp: new Date().toISOString(),
      },
    };

    res.status(HttpStatus.BAD_REQUEST).json(errorResponse);
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token',
        timestamp: new Date().toISOString(),
      },
    };

    res.status(HttpStatus.UNAUTHORIZED).json(errorResponse);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired',
        timestamp: new Date().toISOString(),
      },
    };

    res.status(HttpStatus.UNAUTHORIZED).json(errorResponse);
    return;
  }

  // Log unexpected errors (should be sent to error monitoring service)
  console.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Default error response (don't expose internal details)
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
      timestamp: new Date().toISOString(),
    },
  };

  res.status(HttpStatus.INTERNAL_ERROR).json(errorResponse);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(
    HttpStatus.NOT_FOUND,
    'ROUTE_NOT_FOUND',
    `Cannot ${req.method} ${req.path}`
  );
  next(error);
};
