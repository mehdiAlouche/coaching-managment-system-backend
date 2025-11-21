import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { connectDB } from './config/db';
import routes from './routes';
import { apiLimiter } from './middleware/rateLimit';
import { swaggerSpec, manualEndpoints } from './config/swagger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();


const rawOrigins = process.env.CORS_ORIGIN || '';
const allowedOrigins = rawOrigins ? rawOrigins.split(',').map((s) => s.trim()) : ['http://localhost:3000'];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (mobile clients, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf('*') !== -1 || allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
};

app.use(cors(corsOptions));
// respond to preflight requests
app.options('*', cors(corsOptions));

app.use(express.json());

// Apply general rate limiting to all routes
app.use(apiLimiter);

// Merge manual endpoints with swagger spec
const swaggerSpecWithPaths = {
  ...swaggerSpec,
  paths: manualEndpoints.paths,
};

// Mount Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecWithPaths, { swaggerOptions: { defaultModelsExpandDepth: 1 } }));

// attach routes with versioned base path
app.use('/api/v1', routes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Centralized error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  // attempt DB connection but don't crash hard if not configured in dev
  if (process.env.MONGO_URI) {
    try {
      await connectDB(process.env.MONGO_URI);
      console.log('MongoDB connected');
    } catch (err) {
      console.warn('MongoDB connection failed (continuing without DB):', err);
    }
  } else {
    console.warn('MONGO_URI not set — skipping DB connection');
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
