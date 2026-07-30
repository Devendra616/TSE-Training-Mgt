import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.js";

// Attendance status enum
export enum CompletionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  INCOMPLETE = "incomplete",
}

// Attributes interface
export interface AttendanceAttributes {
  id: number;
  batchId: number;
  employeeId: number;
  dayNumber: number;
  isPresent: boolean;
  completionStatus: CompletionStatus;
  markedAt: Date | null;
  markedBy: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceCreationAttributes extends Optional<
  AttendanceAttributes,
  | "id"
  | "isPresent"
  | "completionStatus"
  | "markedAt"
  | "markedBy"
  | "createdAt"
  | "updatedAt"
> {}

/**
 * Attendance model - Daily attendance per batch per employee
 */
export class Attendance
  extends Model<AttendanceAttributes, AttendanceCreationAttributes>
  implements AttendanceAttributes
{
  declare id: number;
  declare batchId: number;
  declare employeeId: number;
  declare dayNumber: number;
  declare isPresent: boolean;
  declare completionStatus: CompletionStatus;
  declare markedAt: Date | null;
  declare markedBy: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Attendance.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    batchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "batch_id",
      references: {
        model: "batches",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "NO ACTION",
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "employee_id",
      references: {
        model: "employees",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "NO ACTION",
    },
    dayNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "day_number",
      validate: {
        min: 1,
      },
    },
    isPresent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: "is_present",
      defaultValue: false,
    },
    completionStatus: {
      type: DataTypes.ENUM(...Object.values(CompletionStatus)),
      allowNull: false,
      field: "completion_status",
      defaultValue: CompletionStatus.PENDING,
    },
    markedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "marked_at",
    },
    markedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "marked_by",
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "attendance",
    timestamps: true,
    indexes: [
      { fields: ["batch_id", "employee_id", "day_number"], unique: true },
      { fields: ["batch_id"] },
      { fields: ["employee_id"] },
      { fields: ["completion_status"] },
    ],
  },
);

export default Attendance;
