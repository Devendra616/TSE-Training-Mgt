import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

// Attendance status enum
export enum CompletionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  INCOMPLETE = 'incomplete',
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

export interface AttendanceCreationAttributes
  extends Optional<AttendanceAttributes, 'id' | 'isPresent' | 'completionStatus' | 'markedAt' | 'markedBy' | 'createdAt' | 'updatedAt'> {}

/**
 * Attendance model - Daily attendance per batch per employee
 */
export class Attendance extends Model<AttendanceAttributes, AttendanceCreationAttributes>
  implements AttendanceAttributes {
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
      references: {
        model: 'batches',
        key: 'id',
      },
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'employees',
        key: 'id',
      },
    },
    dayNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    isPresent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    completionStatus: {
      type: DataTypes.ENUM(...Object.values(CompletionStatus)),
      allowNull: false,
      defaultValue: CompletionStatus.PENDING,
    },
    markedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    markedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
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
    tableName: 'attendance',
    timestamps: true,
    indexes: [
      { fields: ['batch_id', 'employee_id', 'day_number'], unique: true },
      { fields: ['batch_id'] },
      { fields: ['employee_id'] },
      { fields: ['completion_status'] },
    ],
  }
);

export default Attendance;
