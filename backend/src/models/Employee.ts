import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.js";

// Enums
export enum EmployeeStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

// Attributes interface
export interface EmployeeAttributes {
  id: number;
  sapId: string;
  tokenNo: string | null;
  fullName: string;
  designation: string;
  departmentId: number;
  photoUrl: string | null;
  status: EmployeeStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeCreationAttributes extends Optional<
  EmployeeAttributes,
  "id" | "tokenNo" | "photoUrl" | "status" | "createdAt" | "updatedAt"
> {}

/**
 * Employee model - Employee records
 */
export class Employee
  extends Model<EmployeeAttributes, EmployeeCreationAttributes>
  implements EmployeeAttributes
{
  declare id: number;
  declare sapId: string;
  declare tokenNo: string | null;
  declare fullName: string;
  declare designation: string;
  declare departmentId: number;
  declare photoUrl: string | null;
  declare status: EmployeeStatus;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Employee.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sapId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    tokenNo: {
      type: DataTypes.STRING(5),
      allowNull: true,
      field: "token_no",
      validate: {
        is: /^[A-Za-z]\d{4}$/,
      },
      set(value: string | null | undefined) {
        const normalized =
          typeof value === "string" && value.trim()
            ? value.trim().toUpperCase()
            : null;
        this.setDataValue("tokenNo", normalized);
      },
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    designation: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "department_id",
      references: {
        model: "departments",
        key: "id",
      },
    },
    photoUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(EmployeeStatus)),
      allowNull: false,
      defaultValue: EmployeeStatus.ACTIVE,
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
    tableName: "employees",
    timestamps: true,
    indexes: [
      { fields: ["department_id"] },
      { fields: ["status"] },
      { fields: ["full_name"] },
    ],
  },
);

export default Employee;
