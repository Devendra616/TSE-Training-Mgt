import { Sequelize } from "sequelize";
import { config } from "./index.js";
import { logger } from "../utils/logger.js";

/**
 * PostgreSQL database connection using Sequelize ORM
 */
export const sequelize = new Sequelize({
  dialect: "postgres",
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  username: config.database.user,
  password: config.database.password,
  logging: config.env === "development" ? (msg) => logger.debug(msg) : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true, // Use snake_case for column names
    freezeTableName: true,
  },
});

/**
 * Test database connection
 */
export async function connectDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info("Database connection established successfully");

    await sequelize.sync();
    logger.info("Database schema synchronized successfully");
  } catch (error) {
    logger.error("Unable to connect to database:", error);
    throw error;
  }
}

export default sequelize;
