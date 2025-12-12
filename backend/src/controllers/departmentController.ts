import { Request, Response } from 'express';
import { Department } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';
import { logUserAction } from '../utils/logger.js';

/**
 * Get all departments
 * GET /api/departments
 */
export const getAllDepartments = asyncHandler(async (_req: Request, res: Response) => {
  const departments = await Department.findAll({
    order: [['name', 'ASC']],
  });

  res.json({
    success: true,
    data: { departments },
  });
});

/**
 * Get department by ID
 * GET /api/departments/:id
 */
export const getDepartmentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const department = await Department.findByPk(id, {
    include: ['employees'],
  });

  if (!department) {
    throw new NotFoundError('Department');
  }

  res.json({
    success: true,
    data: { department },
  });
});

/**
 * Create department
 * POST /api/departments
 */
export const createDepartment = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    throw new ValidationError('Department name is required');
  }

  // Check for duplicate
  const existing = await Department.findOne({ where: { name: name.trim() } });
  if (existing) {
    throw new ConflictError('Department with this name already exists');
  }

  const department = await Department.create({ name: name.trim() });

  logUserAction(req.user!.id, 'create', 'departments', department.id);

  res.status(201).json({
    success: true,
    data: { department },
  });
});

/**
 * Update department
 * PUT /api/departments/:id
 */
export const updateDepartment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;

  const department = await Department.findByPk(id);
  if (!department) {
    throw new NotFoundError('Department');
  }

  if (!name || !name.trim()) {
    throw new ValidationError('Department name is required');
  }

  // Check for duplicate (excluding current)
  const existing = await Department.findOne({ where: { name: name.trim() } });
  if (existing && existing.id !== department.id) {
    throw new ConflictError('Department with this name already exists');
  }

  await department.update({ name: name.trim() });

  logUserAction(req.user!.id, 'update', 'departments', department.id);

  res.json({
    success: true,
    data: { department },
  });
});

/**
 * Delete department
 * DELETE /api/departments/:id
 */
export const deleteDepartment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const department = await Department.findByPk(id, {
    include: ['employees'],
  });

  if (!department) {
    throw new NotFoundError('Department');
  }

  // Check if department has employees
  if ((department as any).employees?.length > 0) {
    throw new ValidationError('Cannot delete department with existing employees');
  }

  await department.destroy();

  logUserAction(req.user!.id, 'delete', 'departments', parseInt(id));

  res.json({
    success: true,
    message: 'Department deleted successfully',
  });
});

export default {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
