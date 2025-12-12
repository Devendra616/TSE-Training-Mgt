import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.js';

// Workflow status enum
export enum WorkflowStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// Attendance status for certificate eligibility
export enum AttendanceStatus {
  REGISTERED = 'registered',
  PRESENT = 'present',
  ABSENT = 'absent',
  INCOMPLETE = 'incomplete',
}

// Attributes interface
export interface CertificateAttributes {
  id: number;
  batchId: number;
  employeeId: number;
  attendanceStatus: AttendanceStatus;
  workflowStatus: WorkflowStatus;
  draftCreatedBy: number | null;
  draftCreatedAt: Date | null;
  approvedBy: number | null;
  approvalAt: Date | null;
  rejectionReason: string | null;
  certNumber: string | null;
  certificatePath: string | null;
  nextDueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CertificateCreationAttributes
  extends Optional<CertificateAttributes, 
    'id' | 'attendanceStatus' | 'workflowStatus' | 'draftCreatedBy' | 'draftCreatedAt' | 
    'approvedBy' | 'approvalAt' | 'rejectionReason' | 'certNumber' | 'certificatePath' | 
    'nextDueDate' | 'createdAt' | 'updatedAt'> {}

/**
 * Certificate model - Compliance records with workflow
 */
export class Certificate extends Model<CertificateAttributes, CertificateCreationAttributes>
  implements CertificateAttributes {
  declare id: number;
  declare batchId: number;
  declare employeeId: number;
  declare attendanceStatus: AttendanceStatus;
  declare workflowStatus: WorkflowStatus;
  declare draftCreatedBy: number | null;
  declare draftCreatedAt: Date | null;
  declare approvedBy: number | null;
  declare approvalAt: Date | null;
  declare rejectionReason: string | null;
  declare certNumber: string | null;
  declare certificatePath: string | null;
  declare nextDueDate: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
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
    attendanceStatus: {
      type: DataTypes.ENUM(...Object.values(AttendanceStatus)),
      allowNull: false,
      defaultValue: AttendanceStatus.REGISTERED,
    },
    workflowStatus: {
      type: DataTypes.ENUM(...Object.values(WorkflowStatus)),
      allowNull: false,
      defaultValue: WorkflowStatus.DRAFT,
    },
    draftCreatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    draftCreatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approvalAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    certNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
    certificatePath: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    nextDueDate: {
      type: DataTypes.DATEONLY,
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
    tableName: 'certificates',
    timestamps: true,
    indexes: [
      { fields: ['batch_id', 'employee_id'], unique: true },
      { fields: ['batch_id'] },
      { fields: ['employee_id'] },
      { fields: ['workflow_status'] },
      { fields: ['cert_number'], unique: true },
      { fields: ['next_due_date'] },
    ],
  }
);

export default Certificate;
