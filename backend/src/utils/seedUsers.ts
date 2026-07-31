import bcrypt from "bcrypt";
import { connectDatabase } from "../config/database.js";
import { User, UserRole } from "../models/User.js";
import { logger } from "../utils/logger.js";

async function seed(): Promise<void> {
  try {
    logger.info("Starting Users seeding...");

    await connectDatabase();
    const passwordHash = await bcrypt.hash("password123", 10);

    const userSeeds = [
      {
        email: "admin@mining.com",
        fullName: "System Administrator",
        role: UserRole.ADMIN,
        employeeSapId: null,
      },
    ];

    let createdUsers = 0;
    let updatedUsers = 0;

    for (const seed of userSeeds) {
      const [user, created] = await User.findOrCreate({
        where: { email: seed.email },
        defaults: {
          email: seed.email,
          passwordHash,
          fullName: seed.fullName,
          role: seed.role,
          isActive: true,
        },
      });

      if (created) {
        createdUsers++;
      } else {
        await user.update({
          passwordHash,
          fullName: seed.fullName,
          role: seed.role,
          isActive: true,
        });

        updatedUsers++;
      }
    }

    logger.info(
      `Processed ${userSeeds.length} users (${createdUsers} created, ${updatedUsers} updated)`,
    );
  } catch (error) {
    logger.error("Seeding Users failed:", error);
    process.exit(1);
  }
}

seed();