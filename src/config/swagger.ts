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
            entrepreneur: { 
              type: 'object',
              description: 'Populated entrepreneur user object',
              properties: {
                _id: { type: 'string', format: 'ObjectId' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                email: { type: 'string' },
                startupName: { type: 'string' },
              },
            },
            manager: { 
              type: 'object',
              description: 'Populated manager user object',
              properties: {
                _id: { type: 'string', format: 'ObjectId' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                email: { type: 'string' },
              },
            },
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
    '/sessions/check-conflict': {
      post: {
        summary: 'Check for scheduling conflicts',
        description: 'Check if a coach has a conflicting session at the specified time. Returns conflict status and details.',
        tags: ['Sessions'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['coachId', 'scheduledAt', 'duration'],
                properties: {
                  coachId: { type: 'string', format: 'ObjectId', description: 'Coach ID to check' },
                  scheduledAt: { type: 'string', format: 'date-time', description: 'Proposed session start time' },
                  duration: { type: 'number', description: 'Duration in minutes' },
                  excludeSessionId: { type: 'string', format: 'ObjectId', description: 'Optional session ID to exclude (for updates)' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Conflict check completed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        hasConflict: { type: 'boolean' },
                        conflictingSession: { $ref: '#/components/schemas/Session' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Validation error' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - requires admin, manager, or coach role' },
        },
      },
    },
    '/sessions/calendar': {
      get: {
        summary: 'Get calendar view of sessions',
        description: 'Get sessions grouped by date for calendar visualization. Supports filtering by month, year, coach, entrepreneur, and status.',
        tags: ['Sessions'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'month',
            in: 'query',
            schema: { type: 'number', minimum: 1, maximum: 12 },
            description: 'Month (1-12, default: current month)',
          },
          {
            name: 'year',
            in: 'query',
            schema: { type: 'number' },
            description: 'Year (default: current year)',
          },
          {
            name: 'view',
            in: 'query',
            schema: { type: 'string', enum: ['month'], default: 'month' },
            description: 'View type (currently only month supported)',
          },
          {
            name: 'coachId',
            in: 'query',
            schema: { type: 'string', format: 'ObjectId' },
            description: 'Filter by coach',
          },
          {
            name: 'entrepreneurId',
            in: 'query',
            schema: { type: 'string', format: 'ObjectId' },
            description: 'Filter by entrepreneur',
          },
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['scheduled', 'rescheduled', 'in_progress', 'completed', 'cancelled', 'no_show'] },
            description: 'Filter by status',
          },
        ],
        responses: {
          200: {
            description: 'Calendar view retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        calendar: {
                          type: 'object',
                          additionalProperties: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Session' },
                          },
                          description: 'Sessions grouped by date (YYYY-MM-DD)',
                        },
                        month: { type: 'number' },
                        year: { type: 'number' },
                        total: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid month or year' },
          401: { description: 'Unauthorized' },
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
        summary: 'List users in organization (consolidated)',
        description: 'Get list of active users in the authenticated user\'s organization with optional role filtering. Replaces /coaches and /entrepreneurs endpoints. Only admin and manager roles can access.',
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['coach', 'entrepreneur', 'manager', 'admin'] }, description: 'Filter by user role (e.g., ?role=coach)' },
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
    '/users/profile': {
      get: {
        summary: 'Get current user profile',
        description: 'Retrieve the authenticated user\'s profile. Replaces GET /me endpoint. Also available at /me as an alias.',
        tags: ['Users'],
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
          401: { description: 'Unauthorized' },
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
    '/goals/{goalId}/progress': {
      patch: {
        summary: 'Update goal progress',
        description: 'Update goal progress percentage (0-100). Logs change in update log. Available to admin, manager, coach, and entrepreneur.',
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
                required: ['progress'],
                properties: {
                  progress: {
                    type: 'number',
                    minimum: 0,
                    maximum: 100,
                    description: 'Progress percentage',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Goal progress updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Goal' },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid progress value' },
          404: { description: 'Goal not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - access denied' },
        },
      },
    },
    '/goals/{goalId}/milestones/{milestoneId}': {
      patch: {
        summary: 'Update milestone status',
        description: 'Update milestone status. Auto-sets completedAt when marked as completed. Recalculates goal progress based on completed milestones.',
        tags: ['Goals'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'goalId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'ObjectId' },
          },
          {
            name: 'milestoneId',
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
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['not_started', 'in_progress', 'completed', 'blocked'],
                    description: 'New milestone status',
                  },
                  notes: {
                    type: 'string',
                    description: 'Optional notes about the status change',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Milestone status updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Goal' },
                  },
                },
              },
            },
          },
          404: { description: 'Goal or milestone not found' },
          400: { description: 'Invalid status' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - access denied' },
        },
      },
    },
    '/goals/{goalId}/comments': {
      post: {
        summary: 'Add comment to goal',
        description: 'Add a comment with timestamp to a goal. Available to all roles with goal access.',
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
                required: ['text'],
                properties: {
                  text: {
                    type: 'string',
                    description: 'Comment text',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Comment added successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Goal' },
                  },
                },
              },
            },
          },
          400: { description: 'Validation error' },
          404: { description: 'Goal not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - access denied' },
        },
      },
    },
    '/goals/{goalId}/collaborators': {
      post: {
        summary: 'Add collaborator to goal',
        description: 'Add a user as a collaborator on a goal. Prevents duplicate collaborators. Requires admin, manager, or coach role.',
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
                required: ['userId'],
                properties: {
                  userId: {
                    type: 'string',
                    format: 'ObjectId',
                    description: 'User ID to add as collaborator',
                  },
                  role: {
                    type: 'string',
                    default: 'contributor',
                    description: 'Collaborator role',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Collaborator added successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Goal' },
                  },
                },
              },
            },
          },
          400: { description: 'Validation error or user not in organization' },
          404: { description: 'Goal or user not found' },
          409: { description: 'User is already a collaborator' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - requires admin, manager, or coach role' },
        },
      },
    },
    '/goals/{goalId}/sessions/{sessionId}': {
      post: {
        summary: 'Link session to goal',
        description: 'Associate a session with a goal. Prevents duplicate links. Requires admin, manager, or coach role.',
        tags: ['Goals'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'goalId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'ObjectId' },
          },
          {
            name: 'sessionId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'ObjectId' },
          },
        ],
        responses: {
          201: {
            description: 'Session linked to goal successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Goal' },
                  },
                },
              },
            },
          },
          404: { description: 'Goal or session not found' },
          409: { description: 'Session already linked to this goal' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - requires admin, manager, or coach role' },
        },
      },
    },
    '/payments/generate': {
      post: {
        summary: 'Generate payment from sessions',
        description: 'Auto-generate payment invoice from completed sessions. Validates sessions, calculates totals with 8% tax, auto-generates invoice number. Requires admin or manager role.',
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
                  coachId: {
                    type: 'string',
                    format: 'ObjectId',
                    description: 'Coach ID to generate payment for',
                  },
                  sessionIds: {
                    type: 'array',
                    items: { type: 'string', format: 'ObjectId' },
                    description: 'Array of completed session IDs',
                  },
                  notes: {
                    type: 'string',
                    description: 'Optional notes for the invoice',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Payment generated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Payment' },
                  },
                },
              },
            },
          },
          400: { description: 'Validation error - sessions not completed or belong to different coach' },
          404: { description: 'Coach or sessions not found' },
          409: { description: 'Some sessions are already included in a payment' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - requires admin or manager role' },
        },
      },
    },
    '/payments/{paymentId}/mark-paid': {
      post: {
        summary: 'Mark payment as paid',
        description: 'Mark a payment invoice as paid with optional payment details. Requires admin or manager role.',
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
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  paymentMethod: {
                    type: 'string',
                    description: 'Payment method used (e.g., bank-transfer, credit-card)',
                  },
                  paymentReference: {
                    type: 'string',
                    description: 'Payment transaction reference',
                  },
                  paidAt: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Payment date (defaults to now)',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Payment marked as paid',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Payment' },
                  },
                },
              },
            },
          },
          400: { description: 'Payment is already marked as paid' },
          404: { description: 'Payment not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - requires admin or manager role' },
        },
      },
    },
    '/payments/{paymentId}/invoice': {
      get: {
        summary: 'Download invoice PDF',
        description: 'Generate and download professional invoice PDF using Puppeteer. Coaches can only download their own invoices. Returns PDF file with proper headers.',
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
            description: 'Invoice PDF generated and returned',
            content: {
              'application/pdf': {
                schema: {
                  type: 'string',
                  format: 'binary',
                },
              },
            },
            headers: {
              'Content-Type': {
                schema: { type: 'string', example: 'application/pdf' },
              },
              'Content-Disposition': {
                schema: { type: 'string', example: 'attachment; filename="invoice-INV-001.pdf"' },
              },
            },
          },
          404: { description: 'Payment not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - coaches can only download their own invoices' },
          500: { description: 'PDF generation failed' },
        },
      },
    },
    '/payments/{paymentId}/send-invoice': {
      post: {
        summary: 'Send invoice via email',
        description: 'Event-driven endpoint to generate invoice PDF and send it to the coach via email. Updates remindersSent array. Requires admin or manager role. Email service must be configured for production use.',
        tags: ['Payments'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'paymentId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'ObjectId' },
            description: 'Payment ID whose invoice will be emailed',
          },
        ],
        responses: {
          200: {
            description: 'Invoice email queued successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Invoice email queued for sending' },
                    data: {
                      type: 'object',
                      properties: {
                        paymentId: { type: 'string', format: 'ObjectId' },
                        invoiceNumber: { type: 'string', example: 'INV-001' },
                        recipient: { type: 'string', format: 'email', example: 'coach@example.com' },
                        sentAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { description: 'Payment or coach not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - requires admin or manager role' },
          500: { description: 'Email sending failed' },
        },
      },
    },
    '/payments/stats': {
      get: {
        summary: 'Get payment statistics',
        description: 'Get aggregated payment statistics including counts, totals by status, and revenue metrics. Supports filtering by coach and date range. Available to admin, manager, and coach roles.',
        tags: ['Payments'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'coachId',
            in: 'query',
            schema: { type: 'string', format: 'ObjectId' },
            description: 'Filter by coach (coaches automatically filtered to their own)',
          },
          {
            name: 'startDate',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
            description: 'Filter from date',
          },
          {
            name: 'endDate',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
            description: 'Filter to date',
          },
        ],
        responses: {
          200: {
            description: 'Payment statistics retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        total: { type: 'number', description: 'Total number of payments' },
                        byStatus: {
                          type: 'object',
                          additionalProperties: {
                            type: 'object',
                            properties: {
                              count: { type: 'number' },
                              total: { type: 'number' },
                            },
                          },
                        },
                        revenue: {
                          type: 'object',
                          properties: {
                            totalRevenue: { type: 'number' },
                            totalAmount: { type: 'number' },
                            totalTax: { type: 'number' },
                            averagePayment: { type: 'number' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - requires admin, manager, or coach role' },
        },
      },
    },
    '/notifications/unread-count': {
      get: {
        summary: 'Get unread notification count',
        description: 'Get count of unread notifications for the current user.',
        tags: ['Notifications'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Unread count retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        count: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/notifications/mark-all-read': {
      post: {
        summary: 'Mark all notifications as read',
        description: 'Mark all unread notifications as read for the current user.',
        tags: ['Notifications'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'All notifications marked as read',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        modifiedCount: { type: 'number', description: 'Number of notifications marked as read' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/notifications/{notificationId}': {
      delete: {
        summary: 'Delete notification',
        description: 'Delete a notification. Users can only delete their own notifications.',
        tags: ['Notifications'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'notificationId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'ObjectId' },
          },
        ],
        responses: {
          204: { description: 'Notification deleted successfully' },
          404: { description: 'Notification not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - can only delete own notifications' },
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
    '/sessions/{sessionId}/status': {
      patch: {
        summary: 'Update session status',
        description: 'Update session status independently. Auto-sets endTime when marked as completed. Requires admin, manager, or coach role.',
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
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['scheduled', 'rescheduled', 'in_progress', 'completed', 'cancelled', 'no_show'],
                    description: 'New session status',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Session status updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Session' },
                  },
                },
              },
            },
          },
          404: { description: 'Session not found' },
          400: { description: 'Invalid status' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - requires admin, manager, or coach role' },
        },
      },
    },
    '/sessions/{sessionId}/rating': {
      post: {
        summary: 'Submit session rating and feedback',
        description: 'Submit structured feedback for a completed session. Includes score (1-5), short comment, and detailed feedback. Only entrepreneurs can rate their sessions (or admin/manager). Session must be completed.',
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
                required: ['score'],
                properties: {
                  score: { type: 'number', minimum: 1, maximum: 5, description: 'Rating score (1-5)' },
                  comment: { type: 'string', description: 'Optional short comment' },
                  feedback: { type: 'string', description: 'Optional detailed feedback' },
                },
                example: {
                  score: 5,
                  comment: 'Excellent session!',
                  feedback: 'Very helpful insights on product-market fit. The coach provided actionable advice.'
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Rating submitted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Rating submitted successfully' },
                    rating: {
                      type: 'object',
                      properties: {
                        score: { type: 'number' },
                        comment: { type: 'string' },
                        feedback: { type: 'string' },
                        submittedBy: { type: 'string', format: 'ObjectId' },
                        submittedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid rating score (must be 1-5) or session not completed' },
          403: { description: 'Forbidden - can only rate own sessions' },
          404: { description: 'Session not found' },
          401: { description: 'Unauthorized' },
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
      patch: {
        summary: 'Add role-based notes to session',
        description: 'Add notes specific to coach, entrepreneur, or manager role. Role-based access control applies.',
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
                required: ['role', 'notes'],
                properties: {
                  role: {
                    type: 'string',
                    enum: ['coach', 'entrepreneur', 'manager'],
                    description: 'Role-specific notes field',
                  },
                  notes: {
                    type: 'string',
                    description: 'Notes content',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Role-based notes added successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Session' },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid role or missing notes' },
          404: { description: 'Session not found' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - role mismatch' },
        },
      },
    },
    '/dashboard/manager': {
      get: {
        summary: 'Manager-specific dashboard',
        description: 'Get comprehensive statistics for managers including overview, sessions, goals, revenue, and recent activity. Requires admin or manager role.',
        tags: ['Dashboard'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Manager dashboard data retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        overview: {
                          type: 'object',
                          properties: {
                            totalSessions: { type: 'number' },
                            activeSessions: { type: 'number' },
                            completedSessions: { type: 'number' },
                            activeGoals: { type: 'number' },
                            completedGoals: { type: 'number' },
                            pendingPayments: { type: 'number' },
                            totalRevenue: { type: 'number' },
                            completionRate: { type: 'number' },
                            totalUsers: { type: 'number' },
                          },
                        },
                        sessionsByStatus: {
                          type: 'object',
                          additionalProperties: { type: 'number' },
                        },
                        goalsByPriority: {
                          type: 'object',
                          additionalProperties: { type: 'number' },
                        },
                        sessionsByMonth: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              month: { type: 'string' },
                              count: { type: 'number' },
                            },
                          },
                        },
                        revenueByWeek: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              week: { type: 'string' },
                              revenue: { type: 'number' },
                            },
                          },
                        },
                        recentSessions: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Session' },
                        },
                        upcomingSessions: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Session' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - requires admin or manager role' },
        },
      },
    },
    '/dashboard/coach': {
      get: {
        summary: 'Coach-specific dashboard',
        description: 'Get coach dashboard with upcoming sessions, active goals, payment info, and performance metrics. Requires coach role.',
        tags: ['Dashboard'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Coach dashboard data retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        overview: {
                          type: 'object',
                          properties: {
                            upcomingSessionsCount: { type: 'number' },
                            completedSessionsCount: { type: 'number' },
                            activeGoalsCount: { type: 'number' },
                            pendingPaymentsCount: { type: 'number' },
                            totalEarned: { type: 'number' },
                            averageRating: { type: 'number' },
                          },
                        },
                        nextSession: { $ref: '#/components/schemas/Session' },
                        upcomingSessions: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Session' },
                        },
                        activeGoals: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Goal' },
                        },
                        pendingPayments: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Payment' },
                        },
                        recentSessions: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Session' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - requires coach role' },
        },
      },
    },
    '/dashboard/entrepreneur': {
      get: {
        summary: 'Entrepreneur-specific dashboard',
        description: 'Get entrepreneur dashboard with goals, sessions, and progress summary. Requires entrepreneur role.',
        tags: ['Dashboard'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Entrepreneur dashboard data retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        overview: {
                          type: 'object',
                          properties: {
                            activeGoalsCount: { type: 'number' },
                            completedGoalsCount: { type: 'number' },
                            upcomingSessionsCount: { type: 'number' },
                            completedMilestones: { type: 'number' },
                            averageProgress: { type: 'number' },
                          },
                        },
                        nextSession: { $ref: '#/components/schemas/Session' },
                        upcomingSessions: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Session' },
                        },
                        activeGoals: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Goal' },
                        },
                        recentSessions: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Session' },
                        },
                        progressSummary: {
                          type: 'object',
                          properties: {
                            averageProgress: { type: 'number' },
                            totalMilestones: { type: 'number' },
                            completedMilestones: { type: 'number' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - requires entrepreneur role' },
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
    '/users/{userId}/sessions': {
      get: {
        summary: 'List sessions for user',
        description: 'Return sessions where the specified user participates (as coach, entrepreneur, or manager). Supports same filters as /sessions.',
        tags: ['Sessions', 'Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'ObjectId' }, description: 'User ID whose related sessions to list' },
          { name: 'limit', in: 'query', schema: { type: 'number', default: 20, minimum: 1, maximum: 100 } },
          { name: 'page', in: 'query', schema: { type: 'number', default: 1, minimum: 1 } },
          { name: 'sort', in: 'query', schema: { type: 'string', default: '-createdAt' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled'] } },
          { name: 'upcoming', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: {
          200: {
            description: 'User sessions retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Session' } },
                    meta: { type: 'object', properties: { total: { type: 'number' }, page: { type: 'number' }, limit: { type: 'number' } } },
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
    '/users/{userId}/goals': {
      get: {
        summary: 'List goals for user',
        description: 'Return goals where the specified user is entrepreneur, assigned coach, or collaborator. Filters mirror /goals.',
        tags: ['Goals', 'Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'ObjectId' } },
          { name: 'priority', in: 'query', schema: { type: 'string', enum: ['low', 'medium', 'high'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['not_started', 'in_progress', 'completed', 'blocked'] } },
        ],
        responses: {
          200: {
            description: 'User goals retrieved',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Goal' } }, count: { type: 'number' } } },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/users/{userId}/payments': {
      get: {
        summary: 'List payments for coach',
        description: 'Return payments filtered to the specified coach ID. Other user roles will typically produce an empty set.',
        tags: ['Payments', 'Users'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'ObjectId' }, description: 'Coach user ID' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'paid', 'failed', 'refunded', 'void'] } },
          { name: 'page', in: 'query', schema: { type: 'number', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'number', default: 20, minimum: 1, maximum: 100 } },
          { name: 'sort', in: 'query', schema: { type: 'string', default: '-createdAt' } },
        ],
        responses: {
          200: {
            description: 'User payments retrieved',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Payment' } }, meta: { type: 'object', properties: { total: { type: 'number' }, page: { type: 'number' }, limit: { type: 'number' } } } } },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
        },
      },
    },
  },
};
