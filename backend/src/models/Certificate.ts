import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database.js";

// Workflow status enum
export enum WorkflowStatus {
  DRAFT = "draft",
  PENDING_APPROVAL = "pending_approval",
  APPROVED = "approved",
  REJECTED = "rejected",
}

// Attendance status for certificate eligibility
export enum AttendanceStatus {
  REGISTERED = "registered",
  PRESENT = "present",
  ABSENT = "absent",
  INCOMPLETE = "incomplete",
}

// Attributes interface
export interface CertificateAttributes {
  id: number;
  batchId: number | null;
  trainingId: number | null;
  employeeId: number;
  daysAttended: number;
  attendanceStatus: AttendanceStatus;
  issueDate: Date | null;
  validFrom: Date | null;
  validUntil: Date | null;
  workflowStatus: WorkflowStatus;
  draftCreatedBy: number | null;
  draftCreatedAt: Date | null;
  approvedBy: number | null;
  approvalAt: Date | null;
  rejectionReason: string | null;
  certNumber: string | null;
  certificateNumber: string | null;
  certificatePath: string | null;
  nextDueDate: Date | null;
  createdBy: number | null;
  submittedAt: Date | null;
  submittedBy: number | null;
  rejectedAt: Date | null;
  rejectedBy: number | null;
  isMigrated: boolean;
  migratedAt: Date | null;
  migratedBy: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CertificateCreationAttributes extends Optional<
  CertificateAttributes,
  | "id"
  | "attendanceStatus"
  | "workflowStatus"
  | "draftCreatedBy"
  | "draftCreatedAt"
  | "approvedBy"
  | "approvalAt"
  | "rejectionReason"
  | "certNumber"
  | "certificateNumber"
  | "certificatePath"
  | "nextDueDate"
  | "createdBy"
  | "submittedAt"
  | "submittedBy"
  | "rejectedAt"
  | "rejectedBy"
  | "isMigrated"
  | "migratedAt"
  | "migratedBy"
  | "notes"
  | "createdAt"
  | "updatedAt"
> {}

/**
 * Certificate model - Compliance records with workflow
 */
export class Certificate
  extends Model<CertificateAttributes, CertificateCreationAttributes>
  implements CertificateAttributes
{
  declare id: number;
  declare batchId: number | null;
  declare trainingId: number | null;
  declare employeeId: number;
  declare daysAttended: number;
  declare attendanceStatus: AttendanceStatus;
  declare issueDate: Date | null;
  declare validFrom: Date | null;
  declare validUntil: Date | null;
  declare workflowStatus: WorkflowStatus;
  declare draftCreatedBy: number | null;
  declare draftCreatedAt: Date | null;
  declare approvedBy: number | null;
  declare approvalAt: Date | null;
  declare rejectionReason: string | null;
  declare certNumber: string | null;
  declare certificatePath: string | null;
  declare nextDueDate: Date | null;
  declare createdBy: number | null;
  declare submittedAt: Date | null;
  declare submittedBy: number | null;
  declare rejectedAt: Date | null;
  declare rejectedBy: number | null;
  declare isMigrated: boolean;
  declare migratedAt: Date | null;
  declare migratedBy: number | null;
  declare notes: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  get certificateNumber(): string | null {
    return this.getDataValue("certNumber") as string | null;
  }

  set certificateNumber(value: string | null) {
    this.setDataValue("certNumber", value);
  }
}

Certificate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    batchId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "batch_id",
      references: {
        model: "batches",
        key: "id",
      },
    },
    trainingId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "training_id",
      references: {
        model: "trainings",
        key: "id",
      },
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "employee_id",
      references: {
        model: "employees",
        key: "id",
      },
    },
    daysAttended: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "days_attended",
      defaultValue: 0,
    },
    attendanceStatus: {
      type: DataTypes.ENUM(...Object.values(AttendanceStatus)),
      allowNull: false,
      field: "attendance_status",
      defaultValue: AttendanceStatus.REGISTERED,
    },
    workflowStatus: {
      type: DataTypes.ENUM(...Object.values(WorkflowStatus)),
      allowNull: false,
      field: "workflow_status",
      defaultValue: WorkflowStatus.DRAFT,
    },
    draftCreatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "draft_created_by",
      references: {
        model: "users",
        key: "id",
      },
    },
    draftCreatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "draft_created_at",
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "approved_by",
      references: {
        model: "users",
        key: "id",
      },
    },
    approvalAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "approval_at",
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "rejection_reason",
    },
    certNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "cert_number",
      unique: true,
    },
    certificateNumber: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.getDataValue("certNumber") as string | null;
      },
      set(value: string | null) {
        this.setDataValue("certNumber", value);
      },
    },
    certificatePath: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "certificate_path",
    },
    issueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "issue_date",
    },
    validFrom: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "valid_from",
    },
    validUntil: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "valid_until",
    },
    nextDueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "next_due_date",
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "created_by",
      references: {
        model: "users",
        key: "id",
      },
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "submitted_at",
    },
    submittedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "submitted_by",
      references: {
        model: "users",
        key: "id",
      },
    },
    rejectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "rejected_at",
    },
    rejectedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "rejected_by",
      references: {
        model: "users",
        key: "id",
      },
    },
    isMigrated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: "is_migrated",
      defaultValue: false,
    },
    migratedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "migrated_at",
    },
    migratedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "migrated_by",
      references: {
        model: "users",
        key: "id",
      },
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
    tableName: "certificates",
    timestamps: true,
    indexes: [
      { fields: ["batch_id", "employee_id"], unique: true },
      { fields: ["batch_id"] },
      { fields: ["employee_id"] },
      { fields: ["workflow_status"] },
      { fields: ["cert_number"], unique: true },
      { fields: ["next_due_date"] },
    ],
  },
);

export default Certificate;
