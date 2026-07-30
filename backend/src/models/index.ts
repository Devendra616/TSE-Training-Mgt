/**
 * Database Models Index
 * Exports all models and sets up associations
 */

import sequelize from "../config/database.js";

// Import all models
import User, { UserRole } from "./User.js";
import Department from "./Department.js";
import Employee, { EmployeeStatus } from "./Employee.js";
import Training, { TrainingType } from "./Training.js";
import Batch, { BatchStatus } from "./Batch.js";
import BatchEmployee, { EnrollmentStatus } from "./BatchEmployee.js";
import Attendance, { CompletionStatus } from "./Attendance.js";
import Certificate, {
  WorkflowStatus,
  AttendanceStatus,
} from "./Certificate.js";
import Notification, { NotificationType } from "./Notification.js";
import CertSequence from "./CertSequence.js";

/**
 * Setup model associations
 */
function setupAssociations(): void {
  // User <-> Employee (optional link for system users)
  User.belongsTo(Employee, {
    foreignKey: "employee_id",
    as: "employee",
    onUpdate: "CASCADE",
    onDelete: "NO ACTION",
  });
  Employee.hasOne(User, { foreignKey: "employee_id", as: "user" });

  // Department <-> Employee
  Department.hasMany(Employee, { foreignKey: "department_id", as: "employees" });
  Employee.belongsTo(Department, {
    foreignKey: "department_id",
    as: "department",
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  });

  // Training <-> Batch
  Training.hasMany(Batch, { foreignKey: "training_id", as: "batches" });
  Batch.belongsTo(Training, {
    foreignKey: "training_id",
    as: "training",
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  });

  // Batch <-> Employee (many-to-many through BatchEmployee)
  Batch.belongsToMany(Employee, {
    through: BatchEmployee,
    foreignKey: "batch_id",
    otherKey: "employee_id",
    as: "employees",
  });
  Employee.belongsToMany(Batch, {
    through: BatchEmployee,
    foreignKey: "employee_id",
    otherKey: "batch_id",
    as: "batches",
  });

  // BatchEmployee associations for direct access
  BatchEmployee.belongsTo(Batch, {
    foreignKey: "batch_id",
    as: "batch",
    onUpdate: "CASCADE",
    onDelete: "NO ACTION",
  });
  BatchEmployee.belongsTo(Employee, {
    foreignKey: "employee_id",
    as: "employee",
    onUpdate: "CASCADE",
    onDelete: "NO ACTION",
  });
  BatchEmployee.belongsTo(User, {
    foreignKey: "enrolled_by",
    as: "enrolledByUser",
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  });

  // Attendance associations
  Attendance.belongsTo(Batch, {
    foreignKey: "batch_id",
    as: "batch",
    onUpdate: "CASCADE",
    onDelete: "NO ACTION",
  });
  Attendance.belongsTo(Employee, {
    foreignKey: "employee_id",
    as: "employee",
    onUpdate: "CASCADE",
    onDelete: "NO ACTION",
  });
  Attendance.belongsTo(User, {
    foreignKey: "marked_by",
    as: "markedByUser",
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  });
  Batch.hasMany(Attendance, { foreignKey: "batch_id", as: "attendances" });
  Employee.hasMany(Attendance, { foreignKey: "employee_id", as: "attendances" });

  // Certificate associations
  Certificate.belongsTo(Batch, {
    foreignKey: "batch_id",
    as: "batch",
    onUpdate: "CASCADE",
    onDelete: "NO ACTION",
  });
  Certificate.belongsTo(Training, {
    foreignKey: "training_id",
    as: "training",
    onUpdate: "CASCADE",
    onDelete: "NO ACTION",
  });
  Certificate.belongsTo(Employee, {
    foreignKey: "employee_id",
    as: "employee",
    onUpdate: "CASCADE",
    onDelete: "NO ACTION",
  });
  Certificate.belongsTo(User, {
    foreignKey: "draft_created_by",
    as: "draftCreator",
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  });
  Certificate.belongsTo(User, {
    foreignKey: "approved_by",
    as: "approver",
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  });
  Batch.hasMany(Certificate, { foreignKey: "batch_id", as: "certificates" });
  Training.hasMany(Certificate, {
    foreignKey: "training_id",
    as: "certificates",
  });
  Employee.hasMany(Certificate, {
    foreignKey: "employee_id",
    as: "certificates",
  });

  // Notification associations
  Notification.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });
  User.hasMany(Notification, { foreignKey: "user_id", as: "notifications" });
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
