/**
 * Database Models Index
 * Exports all models and sets up associations
 */

import sequelize from '../config/database.js';

// Import all models
import User, { UserRole } from './User.js';
import Department from './Department.js';
import Employee, { EmployeeStatus } from './Employee.js';
import Training, { TrainingType } from './Training.js';
import Batch, { BatchStatus } from './Batch.js';
import BatchEmployee, { EnrollmentStatus } from './BatchEmployee.js';
import Attendance, { CompletionStatus } from './Attendance.js';
import Certificate, { WorkflowStatus, AttendanceStatus } from './Certificate.js';
import Notification, { NotificationType } from './Notification.js';
import CertSequence from './CertSequence.js';

/**
 * Setup model associations
 */
function setupAssociations(): void {
  // User <-> Employee (optional link for system users)
  User.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  Employee.hasOne(User, { foreignKey: 'employeeId', as: 'user' });

  // Department <-> Employee
  Department.hasMany(Employee, { foreignKey: 'departmentId', as: 'employees' });
  Employee.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

  // Training <-> Batch
  Training.hasMany(Batch, { foreignKey: 'trainingId', as: 'batches' });
  Batch.belongsTo(Training, { foreignKey: 'trainingId', as: 'training' });

  // Batch <-> Employee (many-to-many through BatchEmployee)
  Batch.belongsToMany(Employee, {
    through: BatchEmployee,
    foreignKey: 'batchId',
    otherKey: 'employeeId',
    as: 'employees',
  });
  Employee.belongsToMany(Batch, {
    through: BatchEmployee,
    foreignKey: 'employeeId',
    otherKey: 'batchId',
    as: 'batches',
  });

  // BatchEmployee associations for direct access
  BatchEmployee.belongsTo(Batch, { foreignKey: 'batchId', as: 'batch' });
  BatchEmployee.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  BatchEmployee.belongsTo(User, { foreignKey: 'enrolledBy', as: 'enrolledByUser' });

  // Attendance associations
  Attendance.belongsTo(Batch, { foreignKey: 'batchId', as: 'batch' });
  Attendance.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  Attendance.belongsTo(User, { foreignKey: 'markedBy', as: 'markedByUser' });
  Batch.hasMany(Attendance, { foreignKey: 'batchId', as: 'attendances' });
  Employee.hasMany(Attendance, { foreignKey: 'employeeId', as: 'attendances' });

  // Certificate associations
  Certificate.belongsTo(Batch, { foreignKey: 'batchId', as: 'batch' });
  Certificate.belongsTo(Training, { foreignKey: 'trainingId', as: 'training' });
  Certificate.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });
  Certificate.belongsTo(User, { foreignKey: 'draftCreatedBy', as: 'draftCreator' });
  Certificate.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
  Batch.hasMany(Certificate, { foreignKey: 'batchId', as: 'certificates' });
  Training.hasMany(Certificate, { foreignKey: 'trainingId', as: 'certificates' });
  Employee.hasMany(Certificate, { foreignKey: 'employeeId', as: 'certificates' });

  // Notification associations
  Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
}

// Setup associations
setupAssociations();

// Export everything
export {
  sequelize,
  User,
  UserRole,
  Department,
  Employee,
  EmployeeStatus,
  Training,
  TrainingType,
  Batch,
  BatchStatus,
  BatchEmployee,
  EnrollmentStatus,
  Attendance,
  CompletionStatus,
  Certificate,
  WorkflowStatus,
  AttendanceStatus,
  Notification,
  NotificationType,
  CertSequence,
};

export default {
  sequelize,
  User,
  Department,
  Employee,
  Training,
  Batch,
  BatchEmployee,
  Attendance,
  Certificate,
  Notification,
  CertSequence,
};
