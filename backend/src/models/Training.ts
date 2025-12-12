import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

// Training type enum - used for certificate numbering
export enum TrainingType {
  BASIC = 'BASIC',
  REF = 'REF',     // Refresher
  COJ = 'COJ',     // Change of Job
  OTHR = 'OTHR',   // Other
}

// Attributes interface
export interface TrainingAttributes {
  id: number;
  name: string;
  code: string;
  trainingType: TrainingType;
  validityDays: number;
  durationDays: number;
  isMandatory: boolean;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrainingCreationAttributes
  extends Optional<TrainingAttributes, 'id' | 'description' | 'createdAt' | 'updatedAt'> {}

/**
 * Training model - Training catalog/master
 */
export class Training extends Model<TrainingAttributes, TrainingCreationAttributes>
  implements TrainingAttributes {
  declare id: number;
  declare name: string;
  declare code: string;
  declare trainingType: TrainingType;
  declare validityDays: number;
  declare durationDays: number;
  declare isMandatory: boolean;
  declare description: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Training.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    trainingType: {
      type: DataTypes.ENUM(...Object.values(TrainingType)),
      allowNull: false,
    },
    validityDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    durationDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    isMandatory: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    description: {
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
    tableName: 'trainings',
    timestamps: true,
    indexes: [
      { fields: ['code'], unique: true },
      { fields: ['training_type'] },
      { fields: ['is_mandatory'] },
    ],
  }
);

export default Training;
