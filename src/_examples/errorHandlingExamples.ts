/**
 * Example controller demonstrating the new error handling system
 * This file serves as a reference for migrating existing controllers
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ErrorFactory } from '../_shared/errors/AppError';
import { HttpStatus } from '../_shared/enums/httpStatus';
import { ResponseHelper } from '../_shared/utils/response';
import { UserModel } from '../modules/user/model/user.model';

/**
 * Example 1: Simple CRUD with asyncHandler
 */
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await UserModel.find();
  
  // Using ResponseHelper
  return ResponseHelper.success(res, users);
  
  // Or manually:
  // res.json({ success: true, data: users });
});

/**
 * Example 2: Single resource with 404 handling
 */
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserModel.findById(req.params.id);
  
  if (!user) {
    throw ErrorFactory.notFound('User not found', 'USER_NOT_FOUND');
  }
  
  return ResponseHelper.success(res, user);
});

/**
 * Example 3: Create with conflict check
 */
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  
  // Check for duplicates
  const existing = await UserModel.findOne({ email });
  if (existing) {
    throw ErrorFactory.conflict('Email already exists', 'EMAIL_EXISTS', { email });
  }
  
  const user = await UserModel.create(req.body);
  
  // 201 Created response
  return ResponseHelper.created(res, user);
});

/**
 * Example 4: Update with validation
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  
  // Find user
  const user = await UserModel.findById(id);
  if (!user) {
    throw ErrorFactory.notFound('User not found', 'USER_NOT_FOUND');
  }
  
  // Business logic validation
  if (updates.email && updates.email !== user.email) {
    const emailExists = await UserModel.findOne({ email: updates.email });
    if (emailExists) {
      throw ErrorFactory.conflict('Email already in use', 'EMAIL_IN_USE');
    }
  }
  
  // Apply updates
  Object.assign(user, updates);
  await user.save();
  
  return ResponseHelper.success(res, user);
});

/**
 * Example 5: Delete with cascade check
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserModel.findById(req.params.id);
  
  if (!user) {
    throw ErrorFactory.notFound('User not found', 'USER_NOT_FOUND');
  }
  
  // Business rule: can't delete users with active sessions
  const hasActiveSessions = false; // await checkActiveSessions(user._id);
  if (hasActiveSessions) {
    throw ErrorFactory.unprocessableEntity(
      'Cannot delete user with active sessions',
      'USER_HAS_ACTIVE_SESSIONS'
    );
  }
  
  await user.deleteOne();
  
  return ResponseHelper.noContent(res);
});

/**
 * Example 6: Paginated list
 */
export const getUsersPaginated = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  if (page < 1 || limit < 1 || limit > 100) {
    throw ErrorFactory.badRequest('Invalid pagination parameters', 'INVALID_PAGINATION');
  }
  
  const skip = (page - 1) * limit;
  
  const [users, total] = await Promise.all([
    UserModel.find().skip(skip).limit(limit),
    UserModel.countDocuments(),
  ]);
  
  return ResponseHelper.paginated(res, users, { page, limit, total });
});

/**
 * Example 7: Authorization check
 */
export const deleteOwnAccount = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user?.userId;
  const targetId = req.params.id;
  
  if (!userId) {
    throw ErrorFactory.unauthorized('Not authenticated', 'NOT_AUTHENTICATED');
  }
  
  if (userId !== targetId) {
    throw ErrorFactory.forbidden(
      'You can only delete your own account',
      'INSUFFICIENT_PERMISSIONS'
    );
  }
  
  await UserModel.findByIdAndDelete(targetId);
  
  return ResponseHelper.noContent(res);
});

/**
 * Example 8: Complex business logic with multiple validations
 */
export const transferOwnership = asyncHandler(async (req: Request, res: Response) => {
  const { fromUserId, toUserId, resourceId } = req.body;
  
  // Validate users exist
  const [fromUser, toUser] = await Promise.all([
    UserModel.findById(fromUserId),
    UserModel.findById(toUserId),
  ]);
  
  if (!fromUser) {
    throw ErrorFactory.notFound('Source user not found', 'SOURCE_USER_NOT_FOUND');
  }
  
  if (!toUser) {
    throw ErrorFactory.notFound('Target user not found', 'TARGET_USER_NOT_FOUND');
  }
  
  // Business rule validations
  if (fromUser.organizationId?.toString() !== toUser.organizationId?.toString()) {
    throw ErrorFactory.unprocessableEntity(
      'Users must be in the same organization',
      'ORGANIZATION_MISMATCH'
    );
  }
  
  if (toUser.role === 'entrepreneur') {
    throw ErrorFactory.unprocessableEntity(
      'Target user cannot be an entrepreneur',
      'INVALID_TARGET_ROLE'
    );
  }
  
  // Perform transfer logic here...
  const result = { transferred: true, resourceId };
  
  return ResponseHelper.success(res, result);
});

/**
 * Example 9: Custom error with details
 */
export const validateUserData = asyncHandler(async (req: Request, res: Response) => {
  const errors: any[] = [];
  
  // Custom validation logic
  if (!req.body.email) {
    errors.push({ field: 'email', message: 'Email is required' });
  }
  
  if (!req.body.password || req.body.password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
  }
  
  if (errors.length > 0) {
    throw ErrorFactory.validation('User data validation failed', errors);
  }
  
  return ResponseHelper.success(res, { valid: true });
});

/**
 * Example 10: Handling external service errors
 */
export const sendWelcomeEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  
  try {
    // Simulate external email service
    // await emailService.send(email, 'Welcome!');
    
    return ResponseHelper.success(res, { sent: true });
  } catch (error: any) {
    // Transform external errors to AppError
    throw ErrorFactory.internal(
      'Failed to send email',
      'EMAIL_SERVICE_ERROR'
    );
  }
});
