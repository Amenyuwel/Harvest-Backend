// server.js
import "dotenv/config"; // Modern way to load dotenv in ES Modules
import express from "express";
import mongoose from "mongoose"; // Assuming you still want to use Mongoose, as it's common with Express/MongoDB
import cors from "cors";
import chalk from "chalk";
import morgan from "morgan"; // For request logging (recommended)
import helmet from "helmet"; // For basic security headers (recommended)

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

// --- MongoDB Connection (using Mongoose, as it's a popular ORM for MongoDB) ---
// If you intend to use the 'mongodb' driver directly, the connection logic will be different.
// This example assumes Mongoose for consistency with common setups.
mongoose
  .connect(MONGODB_URI)
  .then(() =>
    console.log(chalk.green.bold("[✓] MongoDB connected successfully"))
  )
  .catch((err) => {
    console.error(chalk.red.bold("[✗] MongoDB connection error:"), err.message);
    process.exit(1); // Exit if DB connection fails at startup
  });

// --- Routes ---
app.get("/", (req, res) => {
  res.send("✅ Backend API is running");
});

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
