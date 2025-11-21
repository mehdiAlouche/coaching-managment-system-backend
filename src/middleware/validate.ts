import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ErrorFactory } from '../_shared/errors/AppError';

export const validate = (schema: z.ZodType<any, any>) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationErrors = error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      
      return next(ErrorFactory.validation('Validation failed', validationErrors));
    }
    next(error);
  }
};