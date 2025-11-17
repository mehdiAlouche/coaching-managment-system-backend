import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { RoleType, getPermissionsForRole, hasPermission, Permission } from '../modules/rbac/permissions';

/**
 * Middleware to check if user has one of the specified roles
 * @param roles - Allowed roles
 * @returns Express middleware
 */
export function requireRole(...roles: RoleType[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userRole = authReq.user.role as RoleType;
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        message: 'Access denied',
        details: `Required role: one of [${roles.join(', ')}], but you are: ${userRole}`,
      });
    }

    next();
  };
}

/**
 * Middleware to check if user has a specific permission
 * @param permission - Required permission
 * @returns Express middleware
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userRole = authReq.user.role as RoleType;
    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({
        message: 'Access denied',
        details: `Required permission: ${permission}`,
        userRole,
      });
    }

    next();
  };
}

/**
 * Get role-aware error message
 */
export function getRoleErrorMessage(userRole: RoleType, requiredRoles: RoleType[]): string {
  return `Access denied. Your role '${userRole}' does not have permission. Required role: one of [${requiredRoles.join(', ')}]`;
}
