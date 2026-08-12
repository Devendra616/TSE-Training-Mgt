import fs from "fs";
import path from "path";
import cron from "node-cron";
import { config } from "../config/index.js";
import { Certificate } from "../models/index.js";
import { logger } from "../utils/logger.js";

const ORPHAN_MAX_AGE_HOURS = 24;

function isValidMigrationFilename(filename: string): boolean {
  return /^cert-[0-9a-fA-F-]+\.[A-Za-z0-9]{1,10}$/.test(filename);
}

function getFileAgeHours(filePath: string): number {
  const stats = fs.statSync(filePath);
  const ageMs = Date.now() - stats.mtime.getTime();
  return ageMs / (1000 * 60 * 60);
}

export async function cleanupOrphanedMigrationFiles(): Promise<void> {
  const directory = config.upload.certificatesDir;

  if (!fs.existsSync(directory)) {
    logger.warn(
      "Migration cleanup skipped: certificates upload directory does not exist",
    );
    return;
  }

  const uploadedFiles = fs.readdirSync(directory);
  let deletedCount = 0;

  for (const filename of uploadedFiles) {
    if (!isValidMigrationFilename(filename)) {
      continue;
    }

    const filePath = path.join(directory, filename);
    try {
      const fileAge = getFileAgeHours(filePath);
      if (fileAge < ORPHAN_MAX_AGE_HOURS) {
        continue;
      }

      const certificate = await Certificate.findOne({
        where: { certificatePath: filename },
      });

      if (!certificate) {
        fs.unlinkSync(filePath);
        deletedCount += 1;
        logger.info("Deleted orphaned migration file", {
          filename,
          fileAgeHours: fileAge.toFixed(2),
        });
      }
    } catch (error) {
      logger.error("Failed to evaluate or delete orphaned migration file", {
        filename,
        error,
      });
    }
  }

  logger.info(
    `Orphaned migration cleanup completed, deleted ${deletedCount} files.`,
  );
}

export function scheduleOrphanedMigrationFileCleanup(): void {
  logger.info("Scheduling orphaned migration file cleanup job");

  cron.schedule("0 0 * * *", async () => {
    logger.info("Running orphaned migration file cleanup job");
    try {
      await cleanupOrphanedMigrationFiles();
    } catch (error) {
      logger.error("Orphaned migration file cleanup job failed", error);
    }
  });
}
