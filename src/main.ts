import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import routes from './routes';

dotenv.config();

const app = express();
app.use(express.json());

// attach routes with versioned base path
app.use('/api/v1', routes);

const PORT = process.env.PORT || 3000;

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
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
