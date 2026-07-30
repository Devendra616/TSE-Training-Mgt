import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.js";

// Enums
export enum UserRole {
  ADMIN = "admin",
  TRAINING_OFFICER = "training_officer",
  MINES_MANAGER = "mines_manager",
}

// Attributes interface
export interface UserAttributes {
  id: number;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  employeeId: number | null;
  signatureUrl: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Creation attributes (optional fields for creation)
export interface UserCreationAttributes extends Optional<
  UserAttributes,
  | "id"
  | "employeeId"
  | "signatureUrl"
  | "isActive"
  | "lastLoginAt"
  | "createdAt"
  | "updatedAt"
> {}

/**
 * User model - System login accounts
 */
export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  declare id: number;
  declare email: string;
  declare passwordHash: string;
  declare fullName: string;
  declare role: UserRole;
  declare employeeId: number | null;
  declare signatureUrl: string | null;
  declare isActive: boolean;
  declare lastLoginAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
      defaultValue: UserRole.TRAINING_OFFICER,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "employees",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "NO ACTION",
    },
    signatureUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
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
    tableName: "users",
    timestamps: true,
    indexes: [{ fields: ["role"] }, { fields: ["is_active"] }],
  },
);

export default User;
