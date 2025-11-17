export type Permission =
  | 'read:sessions'
  | 'create:session'
  | 'update:session'
  | 'delete:session'
  | 'read:goals'
  | 'create:goal'
  | 'update:goal'
  | 'delete:goal'
  | 'read:payments'
  | 'create:payment'
  | 'update:payment'
  | 'read:users'
  | 'manage:users'
  | 'read:dashboard'
  | 'read:organization'
  | 'manage:organization';

export type RoleType = 'admin' | 'manager' | 'coach' | 'entrepreneur';

// Define what each role can do
export const rolePermissions: Record<RoleType, Permission[]> = {
  admin: [
    // Super admin - all permissions
    'read:sessions',
    'create:session',
    'update:session',
    'delete:session',
    'read:goals',
    'create:goal',
    'update:goal',
    'delete:goal',
    'read:payments',
    'create:payment',
    'update:payment',
    'read:users',
    'manage:users',
    'read:dashboard',
    'read:organization',
    'manage:organization',
  ],
  manager: [
    // Manager - organization management and oversight
    'read:sessions',
    'create:session',
    'update:session',
    'read:goals',
    'read:payments',
    'read:users',
    'read:dashboard',
    'read:organization',
  ],
  coach: [
    // Coach - can manage their own sessions and goals
    'read:sessions',
    'create:session',
    'update:session',
    'read:goals',
    'update:goal',
    'read:payments',
    'read:users',
  ],
  entrepreneur: [
    // Entrepreneur - can view their own sessions and goals
    'read:sessions',
    'read:goals',
    'update:goal',
    'read:payments',
  ],
};

// Define which roles can access specific endpoints
export const endpointRoles: Record<string, RoleType[]> = {
  // Sessions
  'GET /sessions': ['admin', 'manager', 'coach', 'entrepreneur'],
  'POST /sessions': ['admin', 'manager', 'coach'],
  'PATCH /sessions/:id': ['admin', 'manager', 'coach'],
  'DELETE /sessions/:id': ['admin', 'manager'],

  // Goals
  'GET /goals': ['admin', 'manager', 'coach', 'entrepreneur'],
  'POST /goals': ['admin', 'manager', 'coach'],
  'PATCH /goals/:id': ['admin', 'manager', 'coach', 'entrepreneur'],
  'DELETE /goals/:id': ['admin', 'manager'],

  // Payments
  'GET /payments': ['admin', 'manager', 'coach'],
  'POST /payments': ['admin', 'manager'],
  'PATCH /payments/:id': ['admin', 'manager'],

  // Users
  'GET /users': ['admin', 'manager'],
  'POST /users': ['admin', 'manager'],
  'PATCH /users/:id': ['admin', 'manager'],
  'DELETE /users/:id': ['admin'],

  // Dashboard
  'GET /dashboard/stats': ['admin', 'manager', 'coach'],

  // Organization
  'GET /organization': ['admin', 'manager'],
  'PATCH /organization': ['admin', 'manager'],
};

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: RoleType): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: RoleType, permission: Permission): boolean {
  return getPermissionsForRole(role).includes(permission);
}

/**
 * Check if a role can access an endpoint
 */
export function canAccessEndpoint(role: RoleType, endpoint: string): boolean {
  const allowedRoles = endpointRoles[endpoint];
  return allowedRoles ? allowedRoles.includes(role) : false;
}

/**
 * Get a human-readable description of role permissions
 */
export function getRoleDescription(role: RoleType): string {
  const descriptions: Record<RoleType, string> = {
    admin: 'Super Admin - Full access to all resources and management features',
    manager: 'Manager - Can manage organization, view all data, and oversee operations',
    coach: 'Coach - Can create and manage sessions, view goals, and see organization data',
    entrepreneur: 'Entrepreneur - Can view own sessions and goals, update personal goals',
  };
  return descriptions[role] || 'Unknown role';
}
