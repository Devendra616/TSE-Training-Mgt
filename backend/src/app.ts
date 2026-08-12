import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import path from "path";

import { config } from "./config/index.js";
import { connectDatabase } from "./config/database.js";
import { getRedisClient } from "./config/redis.js";
import { logger } from "./utils/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { scheduleOrphanedMigrationFileCleanup } from "./jobs/cleanupOrphanedMigrationFiles.js";

// Import models to initialize associations
import "./models/index.js";

// Import routes (to be created)
import apiRoutes from "./routes/index.js";

/**
 * Initialize Express application
 */
function createApp(): Express {
  const app = express();

  // Trust the first reverse proxy (Nginx Proxy Manager)
  app.set("trust proxy", 1);

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          frameAncestors: ["'self'", config.frontendUrl],
        },
      },
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  // CORS configuration
  app.use(
    cors({
      origin: config.frontendUrl,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // Request parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser());

  // Compression
  app.use(compression());

  // Static files for uploads
  app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API routes
  app.use("/api", apiRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();
    logger.info("Database connected");

    // Connect to Redis
    await getRedisClient();
    logger.info("Redis connected");

    // Create and start Express app
    const app = createApp();

    scheduleOrphanedMigrationFileCleanup();

    app.listen(config.port, () => {
      logger.info(
        `Server running on port ${config.port} in ${config.env} mode`,
      );
      logger.info(`Frontend URL: ${config.frontendUrl}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason: unknown) => {
  logger.error("Unhandled Rejection:", reason);
  process.exit(1);
});

// Start the server
startServer();
