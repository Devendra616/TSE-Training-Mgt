import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

// Batch status enum
export enum BatchStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Attributes interface
export interface BatchAttributes {
  id: number;
  trainingId: number;
  startDate: Date;
  endDate: Date;
  capacity: number;
  venue: string;
  instructorName: string;
  status: BatchStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BatchCreationAttributes
  extends Optional<BatchAttributes, 'id' | 'status' | 'notes' | 'createdAt' | 'updatedAt'> {}

/**
 * Batch model - Training events/sessions
 */
export class Batch extends Model<BatchAttributes, BatchCreationAttributes>
  implements BatchAttributes {
  declare id: number;
  declare trainingId: number;
  declare startDate: Date;
  declare endDate: Date;
  declare capacity: number;
  declare venue: string;
  declare instructorName: string;
  declare status: BatchStatus;
  declare notes: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Batch.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    trainingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'trainings',
        key: 'id',
      },
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    venue: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    instructorName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(BatchStatus)),
      allowNull: false,
      defaultValue: BatchStatus.SCHEDULED,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: 'batches',
    timestamps: true,
    indexes: [
      { fields: ['training_id'] },
      { fields: ['status'] },
      { fields: ['start_date'] },
      { fields: ['end_date'] },
    ],
    validate: {
      endDateAfterStart() {
        if (this.endDate < this.startDate) {
          throw new Error('End date must be after or equal to start date');
        }
      },
    },
  }
);

export default Batch;
