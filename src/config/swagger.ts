import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Coaching Management System Backend API',
      version: '0.1.0',
      description:
        'Backend API for the Coaching Management System. Manage organizations, users, coaching sessions, goals, and payments.',
      contact: {
        name: 'API Support',
        url: 'https://github.com/mehdiAlouche/coaching-managment-system-backend',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Local development server',
      },
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Alternative dev server (port 5000)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', format: 'ObjectId', description: 'User unique identifier' },
            email: { type: 'string', format: 'email', description: 'User email address' },
            role: { type: 'string', enum: ['manager', 'coach', 'entrepreneur', 'admin'], description: 'User role' },
            firstName: { type: 'string', description: 'User first name' },
            lastName: { type: 'string', description: 'User last name' },
            organizationId: { type: 'string', format: 'ObjectId', description: 'Organization the user belongs to' },
            hourlyRate: { type: 'number', description: 'Hourly rate (coaches only)' },
            startupName: { type: 'string', description: 'Startup name (entrepreneurs only)' },
            phone: { type: 'string', description: 'User phone number' },
            timezone: { type: 'string', description: 'User timezone' },
            isActive: { type: 'boolean', description: 'Whether the user account is active' },
            createdAt: { type: 'string', format: 'date-time', description: 'Account creation timestamp' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Last update timestamp' },
          },
          required: ['_id', 'email', 'role', 'isActive'],
        },
        Session: {
          type: 'object',
          properties: {
            _id: { type: 'string', format: 'ObjectId' },
            organizationId: { type: 'string', format: 'ObjectId' },
            coachId: { type: 'string', format: 'ObjectId' },
            entrepreneurId: { type: 'string', format: 'ObjectId' },
            managerId: { type: 'string', format: 'ObjectId' },
            scheduledAt: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            duration: { type: 'number', description: 'Duration in minutes' },
            status: { type: 'string', enum: ['scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled'] },
            agendaItems: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  duration: { type: 'number' },
                },
              },
            },
            notes: { type: 'object' },
            location: { type: 'string' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', description: 'JWT token (valid for 24h)' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        DashboardStats: {
          type: 'object',
          properties: {
            users: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                coaches: { type: 'number' },
                entrepreneurs: { type: 'number' },
              },
            },
            sessions: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                upcoming: { type: 'number' },
                completed: { type: 'number' },
              },
            },
            revenue: {
              type: 'object',
              properties: {
                total: { type: 'number' },
              },
            },
          },
        },
        Goal: {
          type: 'object',
          properties: {
            _id: { type: 'string', format: 'ObjectId' },
            organizationId: { type: 'string', format: 'ObjectId' },
            entrepreneurId: { type: 'string', format: 'ObjectId' },
            coachId: { type: 'string', format: 'ObjectId' },
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['not_started', 'in_progress', 'completed', 'blocked'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high'] },
            progress: { type: 'number', minimum: 0, maximum: 100 },
            targetDate: { type: 'string', format: 'date-time' },
            isArchived: { type: 'boolean' },
            milestones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  status: { type: 'string' },
                  targetDate: { type: 'string', format: 'date-time' },
                  completedAt: { type: 'string', format: 'date-time' },
                  notes: { type: 'string' },
                },
              },
            },
            linkedSessions: {
              type: 'array',
              items: { type: 'string', format: 'ObjectId' },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            _id: { type: 'string', format: 'ObjectId' },
            organizationId: { type: 'string', format: 'ObjectId' },
            coachId: { type: 'string', format: 'ObjectId' },
            sessionIds: {
              type: 'array',
              items: { type: 'string', format: 'ObjectId' },
            },
            lineItems: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sessionId: { type: 'string', format: 'ObjectId' },
                  description: { type: 'string' },
                  duration: { type: 'number' },
                  rate: { type: 'number' },
                  amount: { type: 'number' },
                },
              },
            },
            amount: { type: 'number' },
            taxAmount: { type: 'number' },
            totalAmount: { type: 'number' },
            currency: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'paid', 'failed', 'refunded', 'void'] },
            invoiceNumber: { type: 'string' },
            invoiceUrl: { type: 'string' },
            dueDate: { type: 'string', format: 'date-time' },
            paidAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);

// Manual endpoint definitions (since we don't use JSDoc comments in route files)
export const manualEndpoints = {
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        description: 'Create a new user account with email, password, and role.',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'role', 'firstName', 'lastName'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  role: { type: 'string', enum: ['manager', 'coach', 'entrepreneur', 'admin'] },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  organizationId: { type: 'string' },
                  hourlyRate: { type: 'number' },
                  startupName: { type: 'string' },
                  phone: { type: 'string' },
                  timezone: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          400: { description: 'Validation error or email already exists' },
          429: { description: 'Too many registration attempts (3 per hour)' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login user',
        description: 'Authenticate with email and password, receive JWT token.',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          401: { description: 'Invalid credentials or inactive account' },
          429: { description: 'Too many login attempts (5 per 15 min)' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current user profile',
        description: 'Retrieve the authenticated user\'s profile information.',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'User profile retrieved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          401: { description: 'Unauthorized or invalid token' },
        },
      },
    },
    '/sessions': {
      get: {
        summary: 'List all sessions',
        description: 'Get paginated list of sessions for the user\'s organization with optional filters. Available to all roles.',
        tags: ['Sessions'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'number', default: 20, minimum: 1, maximum: 100 },
            description: 'Number of sessions per page',
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'number', default: 1, minimum: 1 },
            description: 'Page number (1-based)',
          },
          {
            name: 'sort',
            in: 'query',
            schema: { type: 'string', default: '-createdAt' },
            description: 'Comma-separated sort fields (prefix with - for descending)',
          },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled'] },
            description: 'Filter by session status',
          },
          {
            name: 'upcoming',
            in: 'query',
            schema: { type: 'boolean' },
            description: 'Filter for upcoming sessions (scheduled or rescheduled)',
          },
        ],
        responses: {
          200: {
            description: 'Sessions retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Session' },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        total: { type: 'number' },
                        page: { type: 'number' },
                        limit: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - insufficient role permissions' },
        },
      },
      post: {
        summary: 'Create session',
        description: 'Create a new coaching session. Requires admin, manager, or coach role. Checks for scheduling conflicts.',
        tags: ['Sessions'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['coachId', 'entrepreneurId', 'managerId', 'scheduledAt', 'duration'],
                properties: {
                  coachId: { type: 'string', format: 'ObjectId' },
                  entrepreneurId: { type: 'string', format: 'ObjectId' },
                  managerId: { type: 'string', format: 'ObjectId' },
                  scheduledAt: { type: 'string', format: 'date-time' },
                  duration: { type: 'number', description: 'Duration in minutes' },
                  agendaItems: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        duration: { type: 'number' },
                      },
                    },
                  },
                  location: { type: 'string' },
                  videoConferenceUrl: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Session created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Session' },
              },
            },
          },
          400: { description: 'Validation error or invalid user IDs' },
          409: { description: 'Coach has a conflicting session at this time' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - insufficient role permissions' },
        },
      },
    },
    '/sessions/{sessionId}': {
      get: {
        summary: 'Get one session',
        description: 'Retrieve a single session by ID. Available to all roles.',
        tags: ['Sessions'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'sessionId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'ObjectId' },
            description: 'Session ID',
          },
        ],
        responses: {
          200: {
            description: 'Session retrieved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Session' },
              },
            },
          },
          404: { description: 'Session not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
      put: {
        summary: 'Update session',
        description: 'Full update of a session. Requires admin, manager, or coach role.',
        tags: ['Sessions'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'sessionId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'ObjectId' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  coachId: { type: 'string', format: 'ObjectId' },
                  entrepreneurId: { type: 'string', format: 'ObjectId' },
                  managerId: { type: 'string', format: 'ObjectId' },
                  scheduledAt: { type: 'string', format: 'date-time' },
                  duration: { type: 'number' },
                  status: { type: 'string', enum: ['scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled'] },
                  agendaItems: { type: 'array' },
                  location: { type: 'string' },
                  videoConferenceUrl: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Session updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Session' },
              },
            },
          },
          404: { description: 'Session not found' },
          409: { description: 'Coach has a conflicting session' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
      patch: {
        summary: 'Partial update session',
        description: 'Partial update of a session (e.g., status only). Requires admin, manager, or coach role.',
        tags: ['Sessions'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'sessionId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'ObjectId' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  scheduledAt: { type: 'string', format: 'date-time' },
                  duration: { type: 'number' },
                  status: { type: 'string', enum: ['scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled'] },
                  notes: { type: 'object' },
                  rating: { type: 'object' },
                  agendaItems: { type: 'array' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Session updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Session' },
              },
            },
          },
          404: { description: 'Session not found' },
          409: { description: 'Coach has a conflicting session' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
      delete: {
        summary: 'Delete session',
        description: 'Delete a session. Requires admin or manager role.',
        tags: ['Sessions'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'sessionId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'ObjectId' },
          },
        ],
        responses: {
          204: { description: 'Session deleted successfully' },
          404: { description: 'Session not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - requires admin or manager role' },
        },
      },
    },
    '/dashboard/stats': {
      get: {
        summary: 'Get dashboard statistics',
        description: 'Retrieve aggregated organization statistics. Requires admin, manager, or coach role.',
        tags: ['Dashboard'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Dashboard statistics retrieved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DashboardStats' },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - insufficient role permissions (requires admin, manager, or coach)' },
        },
      },
    },
    '/users': {
      get: {
        summary: 'List users in organization',
        description: 'Get list of active users in the authenticated user\'s organization. Only admin and manager roles can access. Returns users sorted by creation date (newest first).',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'number', default: 1, minimum: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'number', default: 20, minimum: 1, maximum: 100 } },
          { name: 'sort', in: 'query', schema: { type: 'string', default: '-createdAt' } },
        ],
        responses: {
          200: {
            description: 'Users retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' },
                      description: 'Array of user objects (password field excluded)',
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        total: { type: 'number' },
                        page: { type: 'number' },
                        limit: { type: 'number' },
                      },
                    },
                  },
                },
                example: {
                  data: [
                    {
                      _id: '507f1f77bcf86cd799439011',
                      email: 'john.doe@example.com',
                      role: 'coach',
                      firstName: 'John',
                      lastName: 'Doe',
                      organizationId: '507f1f77bcf86cd799439012',
                      hourlyRate: 75,
                      isActive: true,
                      createdAt: '2024-01-15T10:30:00.000Z',
                      updatedAt: '2024-01-15T10:30:00.000Z',
                    },
                  ],
                  meta: { total: 1, page: 1, limit: 20 },
                },
              },
            },
          },
          400: { description: 'Bad request - Organization ID not found' },
          401: { description: 'Unauthorized - Missing or invalid JWT token' },
          403: { description: 'Forbidden - Only admin and manager roles can access' },
          500: { description: 'Internal server error' },
        },
      },
      post: {
        summary: 'Create user',
        description: 'Create a new user in the organization. Requires admin or manager role.',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'role', 'firstName', 'lastName'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  role: { type: 'string', enum: ['manager', 'coach', 'entrepreneur', 'admin'] },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  hourlyRate: { type: 'number', description: 'Required for coaches' },
                  startupName: { type: 'string', description: 'Required for entrepreneurs' },
                  phone: { type: 'string' },
                  timezone: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          400: { description: 'Validation error or missing required fields' },
          409: { description: 'User with this email already exists' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - requires admin or manager role' },
        },
      },
    },
    '/users/{userId}': {
      get: {
        summary: 'Get one user',
        description: 'Retrieve a single user by ID. Requires admin or manager role.',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'ObjectId' },
          },
        ],
        responses: {
          200: {
            description: 'User retrieved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          404: { description: 'User not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
      put: {
        summary: 'Update user',
        description: 'Full update of a user. Requires admin or manager role.',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'ObjectId' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  role: { type: 'string', enum: ['manager', 'coach', 'entrepreneur', 'admin'] },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  hourlyRate: { type: 'number' },
                  startupName: { type: 'string' },
                  phone: { type: 'string' },
                  timezone: { type: 'string' },
                  isActive: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'User updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          404: { description: 'User not found' },
          409: { description: 'Email already exists' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
      patch: {
        summary: 'Partial update user',
        description: 'Partial update of a user. Requires admin or manager role.',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'ObjectId' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  hourlyRate: { type: 'number' },
                  startupName: { type: 'string' },
                  phone: { type: 'string' },
                  timezone: { type: 'string' },
                  isActive: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'User updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          404: { description: 'User not found' },
          409: { description: 'Email already exists' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
      delete: {
        summary: 'Delete user',
        description: 'Soft delete a user (sets isActive=false). Requires admin or manager role.',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'ObjectId' },
          },
        ],
        responses: {
          204: { description: 'User deleted successfully' },
          404: { description: 'User not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - requires admin or manager role' },
        },
      },
    },
    '/goals': {
      get: {
        summary: 'List all goals',
        description: 'Get list of goals with optional filters. Entrepreneurs see only their goals, coaches see only assigned goals.',
        tags: ['Goals'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'priority',
            in: 'query',
            schema: { type: 'string', enum: ['low', 'medium', 'high'] },
            description: 'Filter by priority',
          },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['not_started', 'in_progress', 'completed', 'blocked'] },
            description: 'Filter by status',
          },
        ],
        responses: {
          200: {
            description: 'Goals retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Goal' },
                    },
                    count: { type: 'number' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
      post: {
        summary: 'Create goal',
        description: 'Create a new goal. Requires admin, manager, or coach role.',
        tags: ['Goals'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['entrepreneurId', 'coachId', 'title'],
                properties: {
                  entrepreneurId: { type: 'string', format: 'ObjectId' },
                  coachId: { type: 'string', format: 'ObjectId' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  status: { type: 'string', enum: ['not_started', 'in_progress', 'completed', 'blocked'] },
                  priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                  targetDate: { type: 'string', format: 'date-time' },
                  milestones: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        status: { type: 'string' },
                        targetDate: { type: 'string', format: 'date-time' },
                        notes: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Goal created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Goal' },
              },
            },
          },
          400: { description: 'Validation error' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/goals/{goalId}': {
      get: {
        summary: 'Get one goal',
        description: 'Retrieve a single goal by ID. Role-based access control applies.',
        tags: ['Goals'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'goalId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'ObjectId' },
          },
        ],
        responses: {
          200: {
            description: 'Goal retrieved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Goal' },
              },
            },
          },
          404: { description: 'Goal not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - access denied' },
        },
      },
      put: {
        summary: 'Update goal',
        description: 'Full update of a goal. Role-based access control applies.',
        tags: ['Goals'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'goalId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'ObjectId' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  entrepreneurId: { type: 'string', format: 'ObjectId' },
                  coachId: { type: 'string', format: 'ObjectId' },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  status: { type: 'string', enum: ['not_started', 'in_progress', 'completed', 'blocked'] },
                  priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                  targetDate: { type: 'string', format: 'date-time' },
                  progress: { type: 'number', minimum: 0, maximum: 100 },
                  milestones: { type: 'array' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Goal updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Goal' },
              },
            },
          },
          404: { description: 'Goal not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
      patch: {
        summary: 'Partial update goal',
        description: 'Partial update of a goal (e.g., progress only). Role-based access control applies.',
        tags: ['Goals'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'goalId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'ObjectId' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  status: { type: 'string', enum: ['not_started', 'in_progress', 'completed', 'blocked'] },
                  priority: { type: 'string', enum: ['low', 'medium', 'high'] },
                  targetDate: { type: 'string', format: 'date-time' },
                  progress: { type: 'number', minimum: 0, maximum: 100 },
                  milestones: { type: 'array' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Goal updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Goal' },
              },
            },
          },
          404: { description: 'Goal not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
      delete: {
        summary: 'Delete goal',
        description: 'Delete a goal. Requires admin or manager role.',
        tags: ['Goals'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'goalId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'ObjectId' },
          },
        ],
        responses: {
          204: { description: 'Goal deleted successfully' },
          404: { description: 'Goal not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - requires admin or manager role' },
        },
      },
    },
    '/payments': {
      get: {
        summary: 'List all payments',
        description: 'Get list of payments/invoices with optional filters. Coaches see only their payments.',
        tags: ['Payments'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['pending', 'paid', 'failed', 'refunded', 'void'] },
            description: 'Filter by payment status',
          },
          { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'number', default: 20, minimum: 1, maximum: 100 } },
          { name: 'sort', in: 'query', schema: { type: 'string', default: '-createdAt' } },
        ],
        responses: {
          200: {
            description: 'Payments retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Payment' },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        total: { type: 'number' },
                        page: { type: 'number' },
                        limit: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
      post: {
        summary: 'Create invoice',
        description: 'Create a new payment invoice from completed sessions. Requires admin or manager role.',
        tags: ['Payments'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['coachId', 'sessionIds'],
                properties: {
                  coachId: { type: 'string', format: 'ObjectId' },
                  sessionIds: {
                    type: 'array',
                    items: { type: 'string', format: 'ObjectId' },
                    description: 'Array of completed session IDs',
                  },
                  amount: { type: 'number', description: 'Subtotal amount (optional, calculated if not provided)' },
                  taxAmount: { type: 'number', default: 0 },
                  currency: { type: 'string', default: 'USD' },
                  dueDate: { type: 'string', format: 'date-time' },
                  period: {
                    type: 'object',
                    properties: {
                      startDate: { type: 'string', format: 'date-time' },
                      endDate: { type: 'string', format: 'date-time' },
                    },
                  },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Payment invoice created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Payment' },
              },
            },
          },
          400: { description: 'Validation error or invalid sessions' },
          409: { description: 'Some sessions are already included in a payment' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - requires admin or manager role' },
        },
      },
    },
    '/payments/{paymentId}': {
      get: {
        summary: 'Get one payment/invoice',
        description: 'Retrieve a single payment/invoice by ID. Coaches can only see their own payments.',
        tags: ['Payments'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'paymentId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'ObjectId' },
          },
        ],
        responses: {
          200: {
            description: 'Payment retrieved',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Payment' },
              },
            },
          },
          404: { description: 'Payment not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
      patch: {
        summary: 'Update payment',
        description: 'Update payment status (mark paid, etc.). Requires admin or manager role.',
        tags: ['Payments'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'paymentId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'ObjectId' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['pending', 'paid', 'failed', 'refunded', 'void'] },
                  invoiceUrl: { type: 'string', format: 'uri' },
                  paidAt: { type: 'string', format: 'date-time' },
                  remindersSent: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        sentAt: { type: 'string', format: 'date-time' },
                        type: { type: 'string', enum: ['email', 'sms', 'in_app'] },
                      },
                    },
                  },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Payment updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Payment' },
              },
            },
          },
          404: { description: 'Payment not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/coaches': {
      get: {
        summary: 'List all coaches',
        description: 'Get list of all active coaches in the organization.',
        tags: ['Coaches'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Coaches retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' },
                    },
                    count: { type: 'number' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/coaches/{coachId}': {
      get: {
        summary: 'Get one coach',
        description: 'Retrieve a single coach with statistics (upcoming sessions, completed sessions, etc.).',
        tags: ['Coaches'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'coachId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'ObjectId' },
          },
        ],
        responses: {
          200: {
            description: 'Coach retrieved with stats',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/User' },
                    {
                      type: 'object',
                      properties: {
                        stats: {
                          type: 'object',
                          properties: {
                            upcomingSessions: { type: 'number' },
                            completedSessions: { type: 'number' },
                            totalSessions: { type: 'number' },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          404: { description: 'Coach not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/entrepreneurs': {
      get: {
        summary: 'List all entrepreneurs',
        description: 'Get list of all active entrepreneurs in the organization.',
        tags: ['Entrepreneurs'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Entrepreneurs retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' },
                    },
                    count: { type: 'number' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/entrepreneurs/{entrepreneurId}': {
      get: {
        summary: 'Get one entrepreneur',
        description: 'Retrieve a single entrepreneur with statistics. Entrepreneurs can only see their own profile.',
        tags: ['Entrepreneurs'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'entrepreneurId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'ObjectId' },
          },
        ],
        responses: {
          200: {
            description: 'Entrepreneur retrieved with stats',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/User' },
                    {
                      type: 'object',
                      properties: {
                        stats: {
                          type: 'object',
                          properties: {
                            upcomingSessions: { type: 'number' },
                            completedSessions: { type: 'number' },
                            activeGoals: { type: 'number' },
                            completedGoals: { type: 'number' },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          404: { description: 'Entrepreneur not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - access denied' },
        },
      },
    },
    '/startups': {
      get: {
        summary: 'List all startups',
        description: 'Get list of all startups (derived from entrepreneurs with startupName).',
        tags: ['Startups'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Startups retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          entrepreneurs: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/User' },
                          },
                        },
                      },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        total: { type: 'number' },
                        page: { type: 'number' },
                        limit: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/startups/{startupId}': {
      get: {
        summary: 'Get one startup',
        description: 'Retrieve a single startup by name (URL-encoded) with all associated entrepreneurs.',
        tags: ['Startups'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'startupId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Startup name (URL-encoded, dashes replaced with spaces)',
          },
        ],
        responses: {
          200: {
            description: 'Startup retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    entrepreneurs: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
          },
          404: { description: 'Startup not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/dashboard/sessions': {
      get: {
        summary: 'Session overview chart',
        description: 'Get session data grouped by date for chart visualization. Requires admin, manager, or coach role.',
        tags: ['Dashboard'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'range',
            in: 'query',
            schema: { type: 'string', enum: ['week', 'month', 'year'], default: 'month' },
            description: 'Time range for the chart',
          },
        ],
        responses: {
          200: {
            description: 'Session overview data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      additionalProperties: {
                        type: 'object',
                        properties: {
                          scheduled: { type: 'number' },
                          completed: { type: 'number' },
                          cancelled: { type: 'number' },
                        },
                      },
                    },
                    range: { type: 'string' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/dashboard/goals-category': {
      get: {
        summary: 'Goals by category (pie chart)',
        description: 'Get goals grouped by status and priority for pie chart visualization. Requires admin, manager, or coach role.',
        tags: ['Dashboard'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Goals category data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    byStatus: {
                      type: 'object',
                      properties: {
                        not_started: { type: 'number' },
                        in_progress: { type: 'number' },
                        completed: { type: 'number' },
                        blocked: { type: 'number' },
                      },
                    },
                    byPriority: {
                      type: 'object',
                      properties: {
                        low: { type: 'number' },
                        medium: { type: 'number' },
                        high: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/dashboard/revenue': {
      get: {
        summary: 'Revenue chart',
        description: 'Get revenue data grouped by date for chart visualization. Requires admin, manager, or coach role.',
        tags: ['Dashboard'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'range',
            in: 'query',
            schema: { type: 'string', enum: ['week', 'month', 'year'], default: 'month' },
            description: 'Time range for the chart',
          },
        ],
        responses: {
          200: {
            description: 'Revenue chart data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      additionalProperties: { type: 'number' },
                      description: 'Revenue by date (YYYY-MM-DD format)',
                    },
                    total: { type: 'number' },
                    range: { type: 'string' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/activities': {
      get: {
        summary: 'List recent activity',
        description: 'Get recent activity feed combining sessions, goals, and payments. Available to all roles.',
        tags: ['Activity'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'number', default: 50, minimum: 1, maximum: 100 },
            description: 'Number of activities to return',
          },
        ],
        responses: {
          200: {
            description: 'Activity feed retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          type: { type: 'string', enum: ['session', 'goal', 'payment'] },
                          action: { type: 'string' },
                          timestamp: { type: 'string', format: 'date-time' },
                          data: { type: 'object' },
                        },
                      },
                    },
                    count: { type: 'number' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
      post: {
        summary: 'Create activity entry',
        description: 'Create a new activity entry (internal use). Currently returns 501 Not Implemented.',
        tags: ['Activity'],
        security: [{ bearerAuth: [] }],
        responses: {
          501: { description: 'Not implemented' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/exports/dashboard': {
      get: {
        summary: 'Export dashboard data',
        description: 'Export all dashboard data (users, sessions, goals, payments) in JSON or CSV format. Requires admin or manager role.',
        tags: ['Export'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'format',
            in: 'query',
            schema: { type: 'string', enum: ['json', 'csv'], default: 'json' },
            description: 'Export format',
          },
        ],
        responses: {
          200: {
            description: 'Dashboard data exported',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    exportedAt: { type: 'string', format: 'date-time' },
                    users: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                    sessions: { type: 'array', items: { $ref: '#/components/schemas/Session' } },
                    goals: { type: 'array', items: { $ref: '#/components/schemas/Goal' } },
                    payments: { type: 'array', items: { $ref: '#/components/schemas/Payment' } },
                    summary: { type: 'object' },
                  },
                },
              },
              'text/csv': {
                schema: { type: 'string' },
              },
            },
          },
          400: { description: 'Unsupported format' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - requires admin or manager role' },
        },
      },
    },
    '/organization': {
      get: {
        summary: 'Get organization settings',
        description: 'Return organization profile, settings, branding, and subscription info.',
        tags: ['Organization'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Organization retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    slug: { type: 'string' },
                    contact: { type: 'object' },
                    preferences: { type: 'object' },
                    logoPath: { type: 'string' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - requires admin or manager role' },
        },
      },
      patch: {
        summary: 'Update organization settings',
        description: 'Update org name, contact info, settings, or branding. Requires admin or manager role.',
        tags: ['Organization'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  billingEmail: { type: 'string', format: 'email' },
                  contact: { type: 'object' },
                  settings: { type: 'object' },
                  preferences: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Organization updated' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/organization/logo': {
      post: {
        summary: 'Upload organization logo',
        description: 'Upload a new logo asset for the organization (PNG/JPEG/WebP/SVG up to 5MB).',
        tags: ['Organization'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  logo: { type: 'string', format: 'binary' },
                },
                required: ['logo'],
              },
            },
          },
        },
        responses: {
          201: { description: 'Logo uploaded' },
          400: { description: 'Invalid file' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/roles': {
      get: {
        summary: 'List roles',
        description: 'Return system roles plus organization-specific custom roles.',
        tags: ['Roles'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Roles retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string' },
                          name: { type: 'string' },
                          slug: { type: 'string' },
                          permissions: { type: 'array', items: { type: 'string' } },
                          isSystem: { type: 'boolean' },
                        },
                      },
                    },
                    count: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create custom role',
        description: 'Create an organization-level role with its own permissions.',
        tags: ['Roles'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  permissions: { type: 'array', items: { type: 'string' } },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Role created' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/roles/{roleId}': {
      patch: {
        summary: 'Update role',
        description: 'Update name, slug, description, or permissions of a role.',
        tags: ['Roles'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'roleId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  permissions: { type: 'array', items: { type: 'string' } },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Role updated' },
          404: { description: 'Role not found' },
        },
      },
      delete: {
        summary: 'Delete custom role',
        description: 'Remove an organization-defined role (system roles cannot be deleted).',
        tags: ['Roles'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'roleId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          204: { description: 'Role deleted' },
          404: { description: 'Role not found' },
          400: { description: 'Cannot delete system role' },
        },
      },
    },
    '/users/{userId}/role': {
      patch: {
        summary: 'Update user role',
        description: 'Admin-only endpoint to assign a new role to a user in the same organization.',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: { type: 'string', enum: ['manager', 'coach', 'entrepreneur', 'admin'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Role updated' },
          404: { description: 'User not found' },
        },
      },
    },
    '/sessions/{sessionId}/notes': {
      get: {
        summary: 'List session notes',
        description: 'Return notes/attendance/tasks for a session. Entrepreneurs only see shared notes.',
        tags: ['Sessions'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Notes retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string' },
                          summary: { type: 'string' },
                          details: { type: 'string' },
                          visibility: { type: 'string', enum: ['internal', 'shared'] },
                          followUpTasks: { type: 'array', items: { type: 'object' } },
                          attendance: { type: 'object' },
                          createdAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                    count: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create session note',
        description: 'Add a coaching note/attendance entry. Coaches can only write notes for their sessions.',
        tags: ['Sessions'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['summary'],
                properties: {
                  summary: { type: 'string' },
                  details: { type: 'string' },
                  visibility: { type: 'string', enum: ['internal', 'shared'] },
                  followUpTasks: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        description: { type: 'string' },
                        dueDate: { type: 'string', format: 'date-time' },
                        completed: { type: 'boolean' },
                      },
                    },
                  },
                  attendance: {
                    type: 'object',
                    properties: {
                      present: { type: 'boolean' },
                      notes: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Session note created' },
          403: { description: 'Forbidden - not allowed to write note' },
        },
      },
    },
    '/upload': {
      post: {
        summary: 'Upload file',
        description: 'Upload general-purpose documents (pitch decks, photos, etc.). Stores metadata for later deletion.',
        tags: ['Files'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                  tags: { type: 'string', description: 'Comma-separated tags' },
                },
                required: ['file'],
              },
            },
          },
        },
        responses: {
          201: { description: 'File uploaded' },
          400: { description: 'Invalid payload' },
        },
      },
    },
    '/upload/{fileId}': {
      delete: {
        summary: 'Delete uploaded file',
        description: 'Remove a file asset and delete it from disk.',
        tags: ['Files'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'fileId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          204: { description: 'File deleted' },
          404: { description: 'File not found' },
        },
      },
    },
    '/notifications': {
      get: {
        summary: 'List notifications',
        description: 'Return notifications for the current user (admins can filter by userId). Supports pagination and unread filter.',
        tags: ['Notifications'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'number', default: 20 } },
          { name: 'sort', in: 'query', schema: { type: 'string', default: '-createdAt' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['unread'] } },
          { name: 'userId', in: 'query', schema: { type: 'string' }, description: 'Admin-only: filter by user' },
        ],
        responses: {
          200: {
            description: 'Notifications retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string' },
                          title: { type: 'string' },
                          message: { type: 'string' },
                          channel: { type: 'string' },
                          readAt: { type: 'string', format: 'date-time', nullable: true },
                          sentAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        total: { type: 'number' },
                        page: { type: 'number' },
                        limit: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/notifications/{notificationId}/read': {
      patch: {
        summary: 'Mark notification as read',
        description: 'Set readAt timestamp for a notification. Users can only mark their own notifications.',
        tags: ['Notifications'],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'notificationId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Notification marked as read' },
          404: { description: 'Notification not found' },
        },
      },
    },
    '/me/sessions': {
      get: {
        summary: 'Get my sessions',
        description: 'Return paginated sessions for the authenticated user (role aware).',
        tags: ['Me'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'number', default: 20 } },
          { name: 'sort', in: 'query', schema: { type: 'string', default: '-createdAt' } },
        ],
        responses: {
          200: { description: 'Sessions retrieved' },
        },
      },
    },
    '/me/goals': {
      get: {
        summary: 'Get my goals',
        description: 'Return paginated goals where the current user is the entrepreneur or coach.',
        tags: ['Me'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'number', default: 20 } },
          { name: 'sort', in: 'query', schema: { type: 'string', default: '-createdAt' } },
        ],
        responses: {
          200: { description: 'Goals retrieved' },
        },
      },
    },
    '/me/startup': {
      get: {
        summary: 'Get my startup',
        description: 'Return startup info and teammates for the authenticated entrepreneur.',
        tags: ['Me'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Startup retrieved' },
          404: { description: 'Startup not found' },
        },
      },
    },
    '/me/payments': {
      get: {
        summary: 'Get my payments',
        description: 'Return paginated payments for the current coach. Other roles receive an empty list.',
        tags: ['Me'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'number', default: 20 } },
          { name: 'sort', in: 'query', schema: { type: 'string', default: '-createdAt' } },
        ],
        responses: {
          200: { description: 'Payments retrieved (possibly empty)' },
        },
      },
    },
    '/me/notifications': {
      get: {
        summary: 'Get my notifications',
        description: 'Same shape as /notifications but always scoped to the current user.',
        tags: ['Me'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'number', default: 20 } },
          { name: 'sort', in: 'query', schema: { type: 'string', default: '-createdAt' } },
        ],
        responses: { 200: { description: 'Notifications retrieved' } },
      },
    },
    '/search': {
      get: {
        summary: 'Global search',
        description: 'Search for sessions, users, goals, and startups by keyword. Admin/manager/coach only.',
        tags: ['Search'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Search string' },
        ],
        responses: {
          200: {
            description: 'Search results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string' },
                    results: {
                      type: 'object',
                      properties: {
                        sessions: { type: 'array', items: { $ref: '#/components/schemas/Session' } },
                        users: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                        goals: { type: 'array', items: { $ref: '#/components/schemas/Goal' } },
                        startups: { type: 'array', items: { type: 'object' } },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Missing query param' },
        },
      },
    },
  },
};
