import 'dotenv/config';
import chalk from 'chalk';
import cors from 'cors';
import express, { type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';

import AuditLogModel from '@/models/AuditLogModel';
import BarangayModel from '@/models/BarangayModel';
import CropsModel from '@/models/CropsModel';
import FarmerModel from '@/models/FarmerModel';
import LoginModel from '@/models/LoginModel';
import PestModel from '@/models/PestModel';
// Models import
import RegisterModel from '@/models/RegisterModel';
import ReportModel from '@/models/ReportModel';

import AuditRoutes from '@/routes/AuditRoute';
import BarangayRoutes from '@/routes/BarangayRoute';
import CropsRoutes from '@/routes/CropsRoute';
import FarmerRoutes from '@/routes/FarmerRoute';
import LoginRoutes from '@/routes/LoginRoute';
import PestRoutes from '@/routes/PestRoute';
// Route import
import RegisterRoutes from '@/routes/RegisterRoute';
import ReportRoute from '@/routes/ReportRoute';

// Middleware import
import { auditRequestMiddleware, auditResponseMiddleware } from '@/middleware/auditMiddleware';
import { extractUserMiddleware } from '@/middleware/authMiddleware';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Custom error interface
interface HttpError extends Error {
  statusCode?: number;
}

// --- Basic Environment Variable Checks ---
if (!MONGODB_URI) {
  console.error(
    chalk.red.bold('[✗] MONGODB_URI environment variable is not set. Please create a .env file.')
  );
  process.exit(1);
}

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(helmet());

// Authentication middleware - extract user info from JWT for audit logging
app.use(extractUserMiddleware);

// Audit middleware
app.use(auditRequestMiddleware);
app.use(auditResponseMiddleware);

// --- MongoDB Connection ---
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log(chalk.green.bold('MongoDB connected successfully'));

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Fetch and log all collections
    const collections = await db.listCollections().toArray();

    // Fetch and log documents from each collection
    for (const col of collections) {
      const docs = await db.collection(col.name).find({}).toArray();
      console.log(
        chalk.magentaBright(`Documents in collection "${col.name}"`),
        docs.length > 0 ? `Found ${docs.length} documents` : 'No documents found'
      );
    }

    // Initialize models
    RegisterModel.setDatabase(db);
    LoginModel.setDatabase(db);
    BarangayModel.setDatabase(db);
    CropsModel.setDatabase(db);
    FarmerModel.setDatabase(db);
    PestModel.setDatabase(db);
    ReportModel.setDatabase(db);
    AuditLogModel.setDatabase(db);
  })
  .catch((err: Error) => {
    console.error(chalk.red.bold('MongoDB connection error:'), err.message);
    process.exit(1);
  });

// --- Routes ---
app.get('/', (_req: Request, res: Response) => {
  res.send('Backend API is running');
});

// ROUTES
app.use('/api/auth', RegisterRoutes);
app.use('/api/auth', LoginRoutes);
app.use('/api/barangays', BarangayRoutes);
app.use('/api/crops', CropsRoutes);
app.use('/api/farmers', FarmerRoutes);
app.use('/api/pests', PestRoutes);
app.use('/api/reports', ReportRoute);
app.use('/api/audit', AuditRoutes);

// --- Error Handling Middleware ---
app.use((err: HttpError, _req: Request, res: Response, _next: NextFunction) => {
  console.error(chalk.red.bold('Unhandled Error:'), err.stack);
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'An unexpected error occurred',
  });
});

// --- Server Startup ---
app.listen(PORT, () => {
  console.log(chalk.cyanBright(`Server is running on http://localhost:${PORT}`));
  console.log(chalk.yellowBright(`Environment: ${process.env.NODE_ENV || 'development'}`));
});

// Optional: Graceful shutdown for MongoDB connection
process.on('SIGINT', () => {
  mongoose.connection.close();
  console.log(chalk.magenta('MongoDB connection disconnected through app termination'));
  process.exit(0);
});
