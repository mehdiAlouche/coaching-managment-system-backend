import { Response } from 'express';
import { HttpStatus } from '../enums/httpStatus';

/**
 * Standard success response format
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Response helper utilities for consistent API responses
 */
export class ResponseHelper {
  /**
   * Send a success response with data
   */
  static success<T>(res: Response, data: T, statusCode = HttpStatus.OK): Response {
    return res.status(statusCode).json({
      success: true,
      data,
    } as SuccessResponse<T>);
  }

  /**
   * Send a created response (201)
   */
  static created<T>(res: Response, data: T): Response {
    return ResponseHelper.success(res, data, HttpStatus.CREATED);
  }

  /**
   * Send a no content response (204)
   */
  static noContent(res: Response): Response {
    return res.status(HttpStatus.NO_CONTENT).send();
  }

  /**
   * Send a paginated response
   */
  static paginated<T>(
    res: Response,
    data: T[],
    pagination: { page: number; limit: number; total: number }
  ): Response {
    return res.status(HttpStatus.OK).json({
      success: true,
      data,
      pagination: {
        ...pagination,
        totalPages: Math.ceil(pagination.total / pagination.limit),
      },
    } as SuccessResponse<T[]>);
  }
}
