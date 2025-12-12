import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

// Attributes interface
export interface DepartmentAttributes {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartmentCreationAttributes
  extends Optional<DepartmentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

/**
 * Department model - Department master
 */
export class Department extends Model<DepartmentAttributes, DepartmentCreationAttributes>
  implements DepartmentAttributes {
  declare id: number;
  declare name: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Department.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
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
    tableName: 'departments',
    timestamps: true,
  }
);

export default Department;
