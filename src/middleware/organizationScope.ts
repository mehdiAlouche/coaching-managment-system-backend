import { Request, Response, NextFunction } from 'express';

// P0: Multi-tenant enforcement. Ensures logged-in user's organization matches the resource's org.
export function requireSameOrganization(req: Request, res: Response, next: NextFunction) {
  const user: any = (req as any).user;
  if (!user) return res.status(401).json({ message: 'Not authenticated' });

  // For incoming requests that include an organization id in either params or body
  const orgId = req.params.organizationId || (req.body && req.body.organizationId) || req.headers['x-organization-id'];
  if (orgId && orgId.toString() !== user.organizationId?.toString()) {
    return res.status(403).json({ message: 'Access outside your organization is forbidden' });
  }

  // attach org id for downstream services
  (req as any).organizationId = user.organizationId;
  next();
}
