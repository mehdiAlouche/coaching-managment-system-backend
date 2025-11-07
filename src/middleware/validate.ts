import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

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
      return res.status(400).json({
        message: 'Validation error',
        errors: error.issues.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    next(error);
  }
};