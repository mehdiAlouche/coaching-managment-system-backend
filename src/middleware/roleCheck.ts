import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../_shared/enums/userRoles';

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user: any = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Not authenticated' });
    if (!roles.includes(user.role)) return res.status(403).json({ message: 'Insufficient role' });
    next();
  };
}
