import { Request, Response } from 'express';
import { Employee, Department, EmployeeStatus } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';
import { logUserAction } from '../utils/logger.js';
import { Op } from 'sequelize';

/**
 * Get all employees with filters
 * GET /api/employees
 */
export const getAllEmployees = asyncHandler(async (req: Request, res: Response) => {
  const { status, departmentId, search, page = 1, limit = 20, sortBy = 'fullName', sortOrder = 'ASC' } = req.query;

  const where: any = {};
  if (status) where.status = status;
  if (departmentId) where.departmentId = departmentId;
  if (search) {
    where[Op.or] = [
      { fullName: { [Op.iLike]: `%${search}%` } },
      { sapId: { [Op.iLike]: `%${search}%` } },
      { designation: { [Op.iLike]: `%${search}%` } },
    ];
  }

  // Validate sort field to prevent SQL injection or errors
  const allowedSortFields = ['fullName', 'sapId', 'designation', 'createdAt', 'status'];
  const sortField = allowedSortFields.includes(String(sortBy)) ? String(sortBy) : 'fullName';
  const order = String(sortOrder).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  const offset = (Number(page) - 1) * Number(limit);

  const { count, rows: employees } = await Employee.findAndCountAll({
    where,
    include: [{ model: Department, as: 'department', attributes: ['id', 'name'] }],
    order: [[sortField, order]],
    limit: Number(limit),
    offset,
  });

  res.json({
    success: true,
    data: {
      employees,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(count / Number(limit)),
      },
    },
  });
});

/**
 * Get employee by ID
 * GET /api/employees/:id
 */
export const getEmployeeById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const employee = await Employee.findByPk(id, {
    include: [
      { model: Department, as: 'department' },
    ],
  });

  if (!employee) {
    throw new NotFoundError('Employee');
  }

  res.json({
    success: true,
    data: { employee },
  });
});

/**
 * Search employees (for autocomplete)
 * GET /api/employees/search
 */
export const searchEmployees = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;

  if (!q || String(q).length < 2) {
    return res.json({ success: true, data: { employees: [] } });
  }

  const employees = await Employee.findAll({
    where: {
      status: EmployeeStatus.ACTIVE,
      [Op.or]: [
        { fullName: { [Op.iLike]: `%${q}%` } },
        { sapId: { [Op.iLike]: `%${q}%` } },
      ],
    },
    attributes: ['id', 'sapId', 'fullName', 'designation', 'photoUrl'],
    include: [{ model: Department, as: 'department', attributes: ['id', 'name'] }],
    limit: 10,
  });

  res.json({
    success: true,
    data: { employees },
  });
});

/**
 * Create employee
 * POST /api/employees
 */
export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { sapId, fullName, designation, departmentId, photoUrl } = req.body;

  // Validate required fields
  if (!sapId || !fullName || !designation || !departmentId) {
    throw new ValidationError('SAP ID, full name, designation, and department are required');
  }

  // Check for duplicate SAP ID
  const existing = await Employee.findOne({ where: { sapId } });
  if (existing) {
    throw new ConflictError('Employee with this SAP ID already exists');
  }

  // Verify department exists
  const department = await Department.findByPk(departmentId);
  if (!department) {
    throw new NotFoundError('Department');
  }

  const employee = await Employee.create({
    sapId,
    fullName: fullName.trim(),
    designation: designation.trim(),
    departmentId,
    photoUrl: photoUrl || null,
    status: EmployeeStatus.ACTIVE,
  });

  logUserAction(req.user!.id, 'create', 'employees', employee.id);

  res.status(201).json({
    success: true,
    data: { employee },
  });
});

/**
 * Update employee
 * PUT /api/employees/:id
 */
export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { sapId, fullName, designation, departmentId, photoUrl, status } = req.body;

  const employee = await Employee.findByPk(id);
  if (!employee) {
    throw new NotFoundError('Employee');
  }

  // Check SAP ID uniqueness if changing
  if (sapId && sapId !== employee.sapId) {
    const existing = await Employee.findOne({ where: { sapId } });
    if (existing) {
      throw new ConflictError('Employee with this SAP ID already exists');
    }
  }

  // Verify department if changing
  if (departmentId && departmentId !== employee.departmentId) {
    const department = await Department.findByPk(departmentId);
    if (!department) {
      throw new NotFoundError('Department');
    }
  }

  await employee.update({
    sapId: sapId || employee.sapId,
    fullName: fullName?.trim() || employee.fullName,
    designation: designation?.trim() || employee.designation,
    departmentId: departmentId || employee.departmentId,
    photoUrl: photoUrl !== undefined ? photoUrl : employee.photoUrl,
    status: status || employee.status,
  });

  logUserAction(req.user!.id, 'update', 'employees', employee.id);

  res.json({
    success: true,
    data: { employee },
  });
});

/**
 * Delete (deactivate) employee
 * DELETE /api/employees/:id
 */
export const deleteEmployee = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const employee = await Employee.findByPk(id);
  if (!employee) {
    throw new NotFoundError('Employee');
  }

  // Soft delete by setting status to inactive
  await employee.update({ status: EmployeeStatus.INACTIVE });

  logUserAction(req.user!.id, 'delete', 'employees', employee.id);

  res.json({
    success: true,
    message: 'Employee deactivated successfully',
  });
});

export default {
  getAllEmployees,
  getEmployeeById,
  searchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
