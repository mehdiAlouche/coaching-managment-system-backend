import { Request, Response, NextFunction } from 'express';
import { AuthenticationError, registerUser, authenticateUser, getCurrentUser } from '../service/authService';
import { RegisterUserDto, LoginUserDto } from '../types/auth.types';
import { AuthRequest } from '../../../middleware/auth';
import { ErrorFactory } from '../../../_shared/errors/AppError';
import { asyncHandler } from '../../../middleware/errorHandler';
import { HttpStatus } from '../../../_shared/enums/httpStatus';

export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const userData: RegisterUserDto = req.body;
  
  try {
    const result = await registerUser(userData);
    res.status(HttpStatus.CREATED).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw ErrorFactory.badRequest(error.message, 'REGISTRATION_ERROR');
    }
    throw error;
  }
});

export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const credentials: LoginUserDto = req.body;
  
  try {
    const result = await authenticateUser(credentials);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw ErrorFactory.unauthorized(error.message, 'AUTHENTICATION_FAILED');
    }
    throw error;
  }
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.userId) {
    throw ErrorFactory.unauthorized('Not authenticated', 'NOT_AUTHENTICATED');
  }

  try {
    const user = await getCurrentUser(req.user.userId);
    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        firstName: user.firstName,
        lastName: user.lastName,
        startupName: user.startupName,
        hourlyRate: user.hourlyRate,
        phone: user.phone,
        timezone: user.timezone,
      },
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw ErrorFactory.unauthorized(error.message, 'USER_NOT_FOUND');
    }
    throw error;
  }
});
