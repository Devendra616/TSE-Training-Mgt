import bcrypt from "bcrypt";
import { connectDatabase } from "../config/database.js";
import { User, UserRole } from "../models/User.js";
import { Department } from "../models/Department.js";
import { Employee, EmployeeStatus } from "../models/Employee.js";
import { Training, TrainingType } from "../models/Training.js";
import { logger } from "../utils/logger.js";

/**
 * Seed database with sample data
 * Run with: npm run db:seed
 */
async function seedDatabase(): Promise<void> {
  try {
    logger.info("Starting database seeding...");

    await connectDatabase();

    const existingUserCount = await User.count();
    logger.info(
      existingUserCount > 0
        ? "Seed data already exists; ensuring default records are present"
        : "No existing user seed data found; creating default seed records",
    );

    const departmentNames = [
      "Deposit 14 Mining",
      "Deposit 14 HEM",
      "T&S,E",
      "Geology",
      "Deposit 14 Transport",
      "Deposit 14 Electrical",
      "Deposit 14 Mechanical",
    ];

    const departmentMap = new Map<string, number>();
    let createdDepartments = 0;
    for (const name of departmentNames) {
      const [department, created] = await Department.findOrCreate({
        where: { name },
        defaults: { name },
      });
      departmentMap.set(name, department.id);
      if (created) {
        createdDepartments += 1;
      }
    }
    logger.info(
      `Processed ${departmentNames.length} departments (${createdDepartments} created, ${departmentNames.length - createdDepartments} already existed)`,
    );

    const employeeSeeds = [
      {
        sapId: "10002414",
        fullName: "Rajesh Kumar",
        designation: "Mining Engineer",
        departmentName: "Deposit 14 Mining",
        status: EmployeeStatus.ACTIVE,
      },
      {
        sapId: "10002415",
        fullName: "Priya Sharma",
        designation: "Safety Officer",
        departmentName: "Deposit 14 HEM",
        status: EmployeeStatus.ACTIVE,
      },
      {
        sapId: "10002416",
        fullName: "Amit Patel",
        designation: "Supervisor",
        departmentName: "Deposit 14 Mining",
        status: EmployeeStatus.ACTIVE,
      },
      {
        sapId: "10002417",
        fullName: "Sunita Devi",
        designation: "Technician",
        departmentName: "T&S,E",
        status: EmployeeStatus.ACTIVE,
      },
      {
        sapId: "10002418",
        fullName: "Vikram Singh",
        designation: "Driver",
        departmentName: "Deposit 14 Transport",
        status: EmployeeStatus.ACTIVE,
      },
      {
        sapId: "10002419",
        fullName: "Ravi Prasad",
        designation: "Electrician",
        departmentName: "Deposit 14 Electrical",
        status: EmployeeStatus.ACTIVE,
      },
      {
        sapId: "10002420",
        fullName: "Meera Gupta",
        designation: "Admin Officer",
        departmentName: "Geology",
        status: EmployeeStatus.ACTIVE,
      },
      {
        sapId: "10002421",
        fullName: "Sanjay Yadav",
        designation: "Mechanic",
        departmentName: "Deposit 14 Mechanical",
        status: EmployeeStatus.ACTIVE,
      },
      {
        sapId: "10002422",
        fullName: "Anita Kumari",
        designation: "Mining Worker",
        departmentName: "Deposit 14 Mining",
        status: EmployeeStatus.ACTIVE,
      },
      {
        sapId: "10002423",
        fullName: "Deepak Verma",
        designation: "Foreman",
        departmentName: "Deposit 14 Mining",
        status: EmployeeStatus.ACTIVE,
      },
    ];

    const employeeMap = new Map<string, number>();
    let createdEmployees = 0;
    for (const seed of employeeSeeds) {
      const [employee, created] = await Employee.findOrCreate({
        where: { sapId: seed.sapId },
        defaults: {
          sapId: seed.sapId,
          fullName: seed.fullName,
          designation: seed.designation,
          departmentId: departmentMap.get(seed.departmentName) ?? 0,
          status: seed.status,
        },
      });
      employeeMap.set(seed.sapId, employee.id);
      if (created) {
        createdEmployees += 1;
      }
    }
    logger.info(
      `Processed ${employeeSeeds.length} employees (${createdEmployees} created, ${employeeSeeds.length - createdEmployees} already existed)`,
    );

    const passwordHash = await bcrypt.hash("password123", 10);
    const userSeeds = [
      {
        email: "admin@mining.com",
        passwordHash,
        fullName: "System Administrator",
        role: UserRole.ADMIN,
        isActive: true,
      },
      {
        email: "officer@mining.com",
        passwordHash,
        fullName: "Training Officer",
        role: UserRole.TRAINING_OFFICER,
        employeeSapId: "10002415",
        isActive: true,
      },
      {
        email: "manager@mining.com",
        passwordHash,
        fullName: "Mines Manager",
        role: UserRole.MINES_MANAGER,
        employeeSapId: "10002414",
        isActive: true,
      },
    ];

    let createdUsers = 0;
    for (const seed of userSeeds) {
      const [user, created] = await User.findOrCreate({
        where: { email: seed.email },
        defaults: {
          email: seed.email,
          passwordHash: seed.passwordHash,
          fullName: seed.fullName,
          role: seed.role,
          employeeId: seed.employeeSapId
            ? employeeMap.get(seed.employeeSapId) ?? null
            : null,
          isActive: seed.isActive,
        },
      });
      if (created) {
        createdUsers += 1;
      }
    }
    logger.info(
      `Processed ${userSeeds.length} users (${createdUsers} created, ${userSeeds.length - createdUsers} already existed)`,
    );

    const trainingSeeds = [
      {
        name: "Initial Safety Training",
        code: "IST-001",
        trainingType: TrainingType.BASIC,
        validityDays: 365,
        durationDays: 5,
        isMandatory: true,
        description: "Basic safety training for all new mining employees",
      },
      {
        name: "First Aid Refresher",
        code: "FA-REF",
        trainingType: TrainingType.REF,
        validityDays: 365,
        durationDays: 1,
        isMandatory: true,
        description: "Annual first aid refresher training",
      },
      {
        name: "Fire Safety Refresher",
        code: "FS-REF",
        trainingType: TrainingType.REF,
        validityDays: 365,
        durationDays: 1,
        isMandatory: true,
        description: "Annual fire safety and evacuation drill",
      },
      {
        name: "Hazardous Material Handling",
        code: "HMH-REF",
        trainingType: TrainingType.REF,
        validityDays: 730,
        durationDays: 2,
        isMandatory: true,
        description: "Handling and disposal of hazardous materials",
      },
      {
        name: "Heavy Equipment Operation",
        code: "HEO-COJ",
        trainingType: TrainingType.COJ,
        validityDays: 730,
        durationDays: 3,
        isMandatory: false,
        description: "Training for operating heavy mining equipment",
      },
      {
        name: "Electrical Safety",
        code: "ES-REF",
        trainingType: TrainingType.REF,
        validityDays: 365,
        durationDays: 1,
        isMandatory: true,
        description: "Electrical safety procedures and protocols",
      },
      {
        name: "Mine Rescue Training",
        code: "MRT-REF",
        trainingType: TrainingType.REF,
        validityDays: 365,
        durationDays: 2,
        isMandatory: true,
        description: "Emergency rescue procedures and equipment",
      },
      {
        name: "Supervisor Leadership",
        code: "SL-OTHR",
        trainingType: TrainingType.OTHR,
        validityDays: 1095,
        durationDays: 3,
        isMandatory: false,
        description: "Leadership and supervisory skills development",
      },
    ];

    let createdTrainings = 0;
    for (const seed of trainingSeeds) {
      const [training, created] = await Training.findOrCreate({
        where: { code: seed.code },
        defaults: {
          name: seed.name,
          code: seed.code,
          trainingType: seed.trainingType,
          validityDays: seed.validityDays,
          durationDays: seed.durationDays,
          isMandatory: seed.isMandatory,
          description: seed.description,
        },
      });
      if (created) {
        createdTrainings += 1;
      }
    }
    logger.info(
      `Processed ${trainingSeeds.length} trainings (${createdTrainings} created, ${trainingSeeds.length - createdTrainings} already existed)`,
    );

    logger.info("Database seeding completed successfully!");
    logger.info("");
    logger.info("=== Login Credentials ===");
    logger.info("Admin: admin@mining.com / password123");
    logger.info("Training Officer: officer@mining.com / password123");
    logger.info("Mines Manager: manager@mining.com / password123");
    logger.info("========================");

    process.exit(0);
  } catch (error) {
    logger.error("Seeding failed:", error);
    process.exit(1);
  }
}

seedDatabase();
