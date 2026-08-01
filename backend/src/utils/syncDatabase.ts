import { sequelize } from "../models/index.js";
import { logger } from "./logger.js";
import { ensureEmployeeTokenNoColumn } from "./ensureEmployeeTokenNoColumn.js";

async function syncDatabase(): Promise<void> {
  try {
    logger.info("Synchronizing database schema...");
    await sequelize.sync();
    await ensureEmployeeTokenNoColumn(sequelize);
    logger.info("Database schema synchronized successfully");
    process.exit(0);
  } catch (error) {
    logger.error("Database synchronization failed:", error);
    process.exit(1);
  }
}

syncDatabase();
