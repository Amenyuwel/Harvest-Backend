// server.js
import "dotenv/config"; // Modern way to load dotenv in ES Modules
import express from "express";
import mongoose from "mongoose"; // Assuming you still want to use Mongoose, as it's common with Express/MongoDB
import cors from "cors";
import chalk from "chalk";
import morgan from "morgan"; // For request logging (recommended)
import helmet from "helmet"; // For basic security headers (recommended)

// Models import
import RegisterModel from "./models/RegisterModel.js";
import LoginModel from "./models/LoginModel.js";
import BarangayModel from "./models/BarangayModel.js";
import CropsModel from "./models/CropsModel.js";
import FarmerModel from "./models/FarmerModel.js";
import PestModel from "./models/PestModel.js";
import PestReportModel from "./models/PestReportModel.js";
import AuditLogModel from "./models/AuditLogModel.js";

// Route import
import RegisterRoutes from "./routes/RegisterRoute.js";
import LoginRoutes from "./routes/LoginRoute.js";
import BarangayRoutes from "./routes/BarangayRoute.js";
import CropsRoutes from "./routes/CropsRoute.js";
import FarmerRoutes from "./routes/FarmerRoute.js";
import PestRoutes from "./routes/PestRoute.js";
import PestReportRoute from "./routes/PestReportRoute.js";
import AuditRoutes from "./routes/AuditRoute.js";

// Middleware import
import { auditRequestMiddleware, auditResponseMiddleware } from "./middleware/auditMiddleware.js";
import { extractUserMiddleware } from "./middleware/authMiddleware.js";

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// --- Basic Environment Variable Checks ---
if (!MONGODB_URI) {
  console.error(
    chalk.red.bold(
      "[✗] MONGODB_URI environment variable is not set. Please create a .env file."
    )
  );
  // It's critical, so we'll exit if it's missing
  process.exit(1);
}

// --- Middleware ---
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Parses incoming URL-encoded requests (if needed)
app.use(morgan("dev")); // HTTP request logger
app.use(helmet()); // Adds various security headers

// Authentication middleware - extract user info from JWT for audit logging
app.use(extractUserMiddleware);

// Audit middleware
app.use(auditRequestMiddleware);
app.use(auditResponseMiddleware);

// --- MongoDB Connection (using Mongoose, as it's a popular ORM for MongoDB) ---
// If you intend to use the 'mongodb' driver directly, the connection logic will be different.
// This example assumes Mongoose for consistency with common setups.
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log(chalk.green.bold("[✓] MongoDB connected successfully"));
    // Fetch and log all collections
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      chalk.blueBright("Available Collections:"),
      collections.map((col) => col.name) // Changed from col.admin to col.name
    );

    // Fetch and log documents from each collection
    for (const col of collections) {
      const docs = await mongoose.connection.db
        .collection(col.name) // Changed from col.admin to col.name
        .find({})
        .toArray();
      console.log(
        chalk.magentaBright(`Documents in collection "${col.name}":`),
        docs.length > 0
          ? `Found ${docs.length} documents`
          : "No documents found"
      );
    }

    // Initialize models
    RegisterModel.setDatabase(mongoose.connection.db);
    LoginModel.setDatabase(mongoose.connection.db);
    BarangayModel.setDatabase(mongoose.connection.db);
    CropsModel.setDatabase(mongoose.connection.db);
    FarmerModel.setDatabase(mongoose.connection.db);
    PestModel.setDatabase(mongoose.connection.db);
    PestReportModel.setDatabase(mongoose.connection.db);
    AuditLogModel.setDatabase(mongoose.connection.db);
  })
  .catch((err) => {
    console.error(chalk.red.bold("[✗] MongoDB connection error:"), err.message);
    process.exit(1);
  });

// --- Routes ---
app.get("/", (req, res) => {
  res.send("✅ Backend API is running");
});

// ROUTES
app.use("/api/auth", RegisterRoutes);
app.use("/api/auth", LoginRoutes);
app.use("/api/barangays", BarangayRoutes);
app.use("/api/crops", CropsRoutes);
app.use("/api/farmers", FarmerRoutes);
app.use("/api/pests", PestRoutes);
app.use("/api/pestReports", PestReportRoute);
app.use("/api/audit", AuditRoutes);

// --- Error Handling Middleware ---
// This should be the last middleware added, to catch any unhandled errors.
app.use((err, req, res, next) => {
  console.error(chalk.red.bold("[✗] Unhandled Error:"), err.stack);
  res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message || "An unexpected error occurred",
  });
});

// --- Server Startup ---
app.listen(PORT, () => {
  console.log(
    chalk.cyanBright(`🚀 Server is running on http://localhost:${PORT}`)
  );
  console.log(
    chalk.yellowBright(`Environment: ${process.env.NODE_ENV || "development"}`)
  );
});

// Optional: Graceful shutdown for MongoDB connection
process.on("SIGINT", () => {
  mongoose.connection.close(() => {
    console.log(
      chalk.magenta("MongoDB connection disconnected through app termination")
    );
    process.exit(0);
  });
});
