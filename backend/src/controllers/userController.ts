import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User, UserRole } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';
import { logUserAction } from '../utils/logger.js';

/**
 * Get all users
 * GET /api/users
 */
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { role, isActive } = req.query;

  const where: any = {};
  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const users = await User.findAll({
    where,
    attributes: ['id', 'email', 'fullName', 'role', 'isActive', 'lastLoginAt', 'createdAt'],
    include: ['employee'],
    order: [['createdAt', 'DESC']],
  });

  res.json({
    success: true,
    data: { users },
  });
});

/**
 * Get user by ID
 * GET /api/users/:id
 */
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await User.findByPk(id, {
    attributes: ['id', 'email', 'fullName', 'role', 'signatureUrl', 'isActive', 'lastLoginAt', 'createdAt'],
    include: ['employee'],
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  res.json({
    success: true,
    data: { user },
  });
});

/**
 * Create user
 * POST /api/users
 */
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, fullName, role, employeeId } = req.body;

  // Validate required fields
  if (!email || !password || !fullName || !role) {
    throw new ValidationError('Email, password, full name, and role are required');
  }

  // Validate role
  if (!Object.values(UserRole).includes(role)) {
    throw new ValidationError(`Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}`);
  }

  // Check if email already exists
  const existingUser = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const user = await User.create({
    email: email.toLowerCase().trim(),
    passwordHash,
    fullName,
    role,
    employeeId: employeeId || null,
    isActive: true,
  });

  // Log action
  logUserAction(req.user!.id, 'create', 'users', user.id);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    },
  });
});

/**
 * Update user
 * PUT /api/users/:id
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, fullName, role, employeeId, isActive } = req.body;

  const user = await User.findByPk(id);
  if (!user) {
    throw new NotFoundError('User');
  }

  // Check email uniqueness if changing
  if (email && email.toLowerCase().trim() !== user.email) {
    const existingUser = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (existingUser) {
      throw new ConflictError('Email already in use');
    }
  }

  // Validate role if provided
  if (role && !Object.values(UserRole).includes(role)) {
    throw new ValidationError(`Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}`);
  }

  // Update user
  await user.update({
    email: email ? email.toLowerCase().trim() : user.email,
    fullName: fullName || user.fullName,
    role: role || user.role,
    employeeId: employeeId !== undefined ? employeeId : user.employeeId,
    isActive: isActive !== undefined ? isActive : user.isActive,
  });

  // Log action
  logUserAction(req.user!.id, 'update', 'users', user.id);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
      },
    },
  });
});

/**
 * Delete user
 * DELETE /api/users/:id
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await User.findByPk(id);
  if (!user) {
    throw new NotFoundError('User');
  }

  // Prevent self-deletion
  if (user.id === req.user!.id) {
    throw new ValidationError('Cannot delete your own account');
  }

  // Soft delete by deactivating
  await user.update({ isActive: false });

  // Log action
  logUserAction(req.user!.id, 'delete', 'users', user.id);

  res.json({
    success: true,
    message: 'User deactivated successfully',
  });
});

/**
 * Reset user password (Admin only)
 * PUT /api/users/:id/reset-password
 */
export const resetUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    throw new ValidationError('New password must be at least 8 characters');
  }

  const user = await User.findByPk(id);
  if (!user) {
    throw new NotFoundError('User');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await user.update({ passwordHash });

  // Log action
  logUserAction(req.user!.id, 'password_reset', 'users', user.id);

  res.json({
    success: true,
    message: 'Password reset successfully',
  });
});

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
};
