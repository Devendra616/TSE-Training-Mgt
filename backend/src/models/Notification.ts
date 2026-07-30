import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.js";

// Notification type enum
export enum NotificationType {
  INFO = "info",
  WARNING = "warning",
  SUCCESS = "success",
  ERROR = "error",
  DUE_REMINDER = "due_reminder",
  OVERDUE_ALERT = "overdue_alert",
  APPROVAL_REQUEST = "approval_request",
  APPROVAL_RESULT = "approval_result",
}

// Attributes interface
export interface NotificationAttributes {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt: Date | null;
  link: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationCreationAttributes extends Optional<
  NotificationAttributes,
  "id" | "isRead" | "readAt" | "link" | "createdAt" | "updatedAt"
> {}

/**
 * Notification model - In-app notifications
 */
export class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  declare id: number;
  declare userId: number;
  declare title: string;
  declare message: string;
  declare type: NotificationType;
  declare isRead: boolean;
  declare readAt: Date | null;
  declare link: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
      references: {
        model: "users",
        key: "id",
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(NotificationType)),
      allowNull: false,
      defaultValue: NotificationType.INFO,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: "is_read",
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "read_at",
    },
    link: {
      type: DataTypes.STRING(500),
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
    tableName: "notifications",
    timestamps: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["is_read"] },
      { fields: ["type"] },
      { fields: ["created_at"] },
    ],
  },
);

export default Notification;
