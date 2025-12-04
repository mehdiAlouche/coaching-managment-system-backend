import { Request, Response, NextFunction } from 'express';

// P0: Multi-tenant enforcement. Ensures logged-in user's organization matches the resource's org.
// Admins have global access across all organizations.
export function requireSameOrganization(req: Request, res: Response, next: NextFunction) {
  const user: any = (req as any).user;
  if (!user) return res.status(401).json({ message: 'Not authenticated' });

  // Admins can access across all organizations (no org filtering)
  if (user.role === 'admin') {
    (req as any).organizationId = null; // null signals global admin access
    (req as any).isAdmin = true;
    return next();
  }

  // For non-admins: enforce organization scope
  const orgId = req.params.organizationId || (req.body && req.body.organizationId) || req.headers['x-organization-id'];
  if (orgId && orgId.toString() !== user.organizationId?.toString()) {
    return res.status(403).json({ message: 'Access outside your organization is forbidden' });
  }

  // attach org id for downstream services
  (req as any).organizationId = user.organizationId;
  (req as any).isAdmin = false;
  next();
}
