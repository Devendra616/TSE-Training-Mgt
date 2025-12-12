import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

// Enrollment status
export enum EnrollmentStatus {
  ENROLLED = 'enrolled',
  WITHDRAWN = 'withdrawn',
}

// Attributes interface
export interface BatchEmployeeAttributes {
  id: number;
  batchId: number;
  employeeId: number;
  enrollmentStatus: EnrollmentStatus;
  enrolledAt: Date;
  enrolledBy: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BatchEmployeeCreationAttributes
  extends Optional<BatchEmployeeAttributes, 'id' | 'enrollmentStatus' | 'enrolledAt' | 'enrolledBy' | 'createdAt' | 'updatedAt'> {}

/**
 * BatchEmployee model - Junction table for batch enrollment
 */
export class BatchEmployee extends Model<BatchEmployeeAttributes, BatchEmployeeCreationAttributes>
  implements BatchEmployeeAttributes {
  declare id: number;
  declare batchId: number;
  declare employeeId: number;
  declare enrollmentStatus: EnrollmentStatus;
  declare enrolledAt: Date;
  declare enrolledBy: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

BatchEmployee.init(
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
    enrollmentStatus: {
      type: DataTypes.ENUM(...Object.values(EnrollmentStatus)),
      allowNull: false,
      defaultValue: EnrollmentStatus.ENROLLED,
    },
    enrolledAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    enrolledBy: {
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
    tableName: 'batch_employees',
    timestamps: true,
    indexes: [
      { fields: ['batch_id', 'employee_id'], unique: true },
      { fields: ['batch_id'] },
      { fields: ['employee_id'] },
    ],
  }
);

export default BatchEmployee;
