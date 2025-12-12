import { DataTypes, Model, Optional, Transaction } from 'sequelize';
import sequelize from '../config/database.js';

// Attributes interface
export interface CertSequenceAttributes {
  id: number;
  trainingType: string;
  year: number;
  lastSeq: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CertSequenceCreationAttributes
  extends Optional<CertSequenceAttributes, 'id' | 'lastSeq' | 'createdAt' | 'updatedAt'> {}

/**
 * CertSequence model - Atomic sequence counter for certificate numbers
 * Format: [TrainingType]/[Year]/[EmpID]/[SeqNo]
 */
export class CertSequence extends Model<CertSequenceAttributes, CertSequenceCreationAttributes>
  implements CertSequenceAttributes {
  declare id: number;
  declare trainingType: string;
  declare year: number;
  declare lastSeq: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  /**
   * Get next sequence number atomically
   * Uses transaction to ensure uniqueness
   */
  static async getNextSequence(
    trainingType: string,
    year: number,
    transaction?: Transaction
  ): Promise<number> {
    const [sequence, created] = await CertSequence.findOrCreate({
      where: { trainingType, year },
      defaults: { trainingType, year, lastSeq: 0 },
      transaction,
    });

    // Increment atomically
    await sequence.increment('lastSeq', { transaction });
    await sequence.reload({ transaction });

    return sequence.lastSeq;
  }
}

CertSequence.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    trainingType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    lastSeq: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: 'cert_sequences',
    timestamps: true,
    indexes: [
      { fields: ['training_type', 'year'], unique: true },
    ],
  }
);

export default CertSequence;
