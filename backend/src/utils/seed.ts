import bcrypt from 'bcrypt';
import { sequelize } from '../models/index.js';
import { User, UserRole } from '../models/User.js';
import { Department } from '../models/Department.js';
import { Employee, EmployeeStatus } from '../models/Employee.js';
import { Training, TrainingType } from '../models/Training.js';
import { logger } from '../utils/logger.js';

/**
 * Seed database with sample data
 * Run with: npm run db:seed
 */
async function seedDatabase(): Promise<void> {
  try {
    logger.info('Starting database seeding...');

    // Sync database (force recreate tables)
    await sequelize.sync({ force: true });
    logger.info('Database tables created');

    // 1. Create Departments
    const departments = await Department.bulkCreate([
      { name: 'Deposit 14 Mining' },
      { name: 'Deposit 14 HEM' },
      { name: 'T&S,E' },
      { name: 'Geology' },
      { name: 'Deposit 14 Transport' },
      { name: 'Deposit 14 Electrical' },
      { name: 'Deposit 14 Mechanical' },
    ]);
    logger.info(`Created ${departments.length} departments`);

    // 2. Create Employees
    const employees = await Employee.bulkCreate([
      { sapId: '10002414', fullName: 'Rajesh Kumar', designation: 'Mining Engineer', departmentId: 1, status: EmployeeStatus.ACTIVE },
      { sapId: '10002415', fullName: 'Priya Sharma', designation: 'Safety Officer', departmentId: 2, status: EmployeeStatus.ACTIVE },
      { sapId: '10002416', fullName: 'Amit Patel', designation: 'Supervisor', departmentId: 1, status: EmployeeStatus.ACTIVE },
      { sapId: '10002417', fullName: 'Sunita Devi', designation: 'Technician', departmentId: 3, status: EmployeeStatus.ACTIVE },
      { sapId: '10002418', fullName: 'Vikram Singh', designation: 'Driver', departmentId: 5, status: EmployeeStatus.ACTIVE },
      { sapId: '10002419', fullName: 'Ravi Prasad', designation: 'Electrician', departmentId: 6, status: EmployeeStatus.ACTIVE },
      { sapId: '10002420', fullName: 'Meera Gupta', designation: 'Admin Officer', departmentId: 4, status: EmployeeStatus.ACTIVE },
      { sapId: '10002421', fullName: 'Sanjay Yadav', designation: 'Mechanic', departmentId: 7, status: EmployeeStatus.ACTIVE },
      { sapId: '10002422', fullName: 'Anita Kumari', designation: 'Mining Worker', departmentId: 1, status: EmployeeStatus.ACTIVE },
      { sapId: '10002423', fullName: 'Deepak Verma', designation: 'Foreman', departmentId: 1, status: EmployeeStatus.ACTIVE },
    ]);
    logger.info(`Created ${employees.length} employees`);

    // 3. Create Users (system login accounts)
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const users = await User.bulkCreate([
      {
        email: 'admin@mining.com',
        passwordHash,
        fullName: 'System Administrator',
        role: UserRole.ADMIN,
        isActive: true,
      },
      {
        email: 'officer@mining.com',
        passwordHash,
        fullName: 'Training Officer',
        role: UserRole.TRAINING_OFFICER,
        employeeId: employees[1].id, // Priya Sharma
        isActive: true,
      },
      {
        email: 'manager@mining.com',
        passwordHash,
        fullName: 'Mines Manager',
        role: UserRole.MINES_MANAGER,
        employeeId: employees[0].id, // Rajesh Kumar
        isActive: true,
      },
    ]);
    logger.info(`Created ${users.length} users`);

    // 4. Create Trainings
    const trainings = await Training.bulkCreate([
      {
        name: 'Initial Safety Training',
        code: 'IST-001',
        trainingType: TrainingType.BASIC,
        validityDays: 365,
        durationDays: 5,
        isMandatory: true,
        description: 'Basic safety training for all new mining employees',
      },
      {
        name: 'First Aid Refresher',
        code: 'FA-REF',
        trainingType: TrainingType.REF,
        validityDays: 365,
        durationDays: 1,
        isMandatory: true,
        description: 'Annual first aid refresher training',
      },
      {
        name: 'Fire Safety Refresher',
        code: 'FS-REF',
        trainingType: TrainingType.REF,
        validityDays: 365,
        durationDays: 1,
        isMandatory: true,
        description: 'Annual fire safety and evacuation drill',
      },
      {
        name: 'Hazardous Material Handling',
        code: 'HMH-REF',
        trainingType: TrainingType.REF,
        validityDays: 730,
        durationDays: 2,
        isMandatory: true,
        description: 'Handling and disposal of hazardous materials',
      },
      {
        name: 'Heavy Equipment Operation',
        code: 'HEO-COJ',
        trainingType: TrainingType.COJ,
        validityDays: 730,
        durationDays: 3,
        isMandatory: false,
        description: 'Training for operating heavy mining equipment',
      },
      {
        name: 'Electrical Safety',
        code: 'ES-REF',
        trainingType: TrainingType.REF,
        validityDays: 365,
        durationDays: 1,
        isMandatory: true,
        description: 'Electrical safety procedures and protocols',
      },
      {
        name: 'Mine Rescue Training',
        code: 'MRT-REF',
        trainingType: TrainingType.REF,
        validityDays: 365,
        durationDays: 2,
        isMandatory: true,
        description: 'Emergency rescue procedures and equipment',
      },
      {
        name: 'Supervisor Leadership',
        code: 'SL-OTHR',
        trainingType: TrainingType.OTHR,
        validityDays: 1095,
        durationDays: 3,
        isMandatory: false,
        description: 'Leadership and supervisory skills development',
      },
    ]);
    logger.info(`Created ${trainings.length} trainings`);

    logger.info('Database seeding completed successfully!');
    logger.info('');
    logger.info('=== Login Credentials ===');
    logger.info('Admin: admin@mining.com / password123');
    logger.info('Training Officer: officer@mining.com / password123');
    logger.info('Mines Manager: manager@mining.com / password123');
    logger.info('========================');

    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
