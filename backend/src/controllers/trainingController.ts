import { Request, Response } from 'express';
import { Training, TrainingType } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors.js';
import { logUserAction } from '../utils/logger.js';
import { Op } from 'sequelize';

/**
 * Get all trainings with filters
 * GET /api/trainings
 */
export const getAllTrainings = asyncHandler(async (req: Request, res: Response) => {
  const { trainingType, isMandatory, search } = req.query;

  const where: any = {};
  if (trainingType) where.trainingType = trainingType;
  if (isMandatory !== undefined) where.isMandatory = isMandatory === 'true';
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { code: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const trainings = await Training.findAll({
    where,
    order: [['name', 'ASC']],
  });

  res.json({
    success: true,
    data: { trainings },
  });
});

/**
 * Get training by ID
 * GET /api/trainings/:id
 */
export const getTrainingById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const training = await Training.findByPk(id);

  if (!training) {
    throw new NotFoundError('Training');
  }

  res.json({
    success: true,
    data: { training },
  });
});

/**
 * Create training
 * POST /api/trainings
 */
export const createTraining = asyncHandler(async (req: Request, res: Response) => {
  const { name, code, trainingType, validityDays, durationDays, isMandatory, description } = req.body;

  // Validate required fields
  if (!name || !code || !trainingType || !validityDays || !durationDays) {
    throw new ValidationError('Name, code, training type, validity days, and duration days are required');
  }

  // Validate training type
  if (!Object.values(TrainingType).includes(trainingType)) {
    throw new ValidationError(`Invalid training type. Must be one of: ${Object.values(TrainingType).join(', ')}`);
  }

  // Check for duplicate code
  const existing = await Training.findOne({ where: { code: code.toUpperCase() } });
  if (existing) {
    throw new ConflictError('Training with this code already exists');
  }

  const training = await Training.create({
    name: name.trim(),
    code: code.toUpperCase().trim(),
    trainingType,
    validityDays: Number(validityDays),
    durationDays: Number(durationDays),
    isMandatory: isMandatory || false,
    description: description?.trim() || null,
  });

  logUserAction(req.user!.id, 'create', 'trainings', training.id);

  res.status(201).json({
    success: true,
    data: { training },
  });
});

/**
 * Update training
 * PUT /api/trainings/:id
 */
export const updateTraining = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, code, trainingType, validityDays, durationDays, isMandatory, description } = req.body;

  const training = await Training.findByPk(id);
  if (!training) {
    throw new NotFoundError('Training');
  }

  // Check code uniqueness if changing
  if (code && code.toUpperCase() !== training.code) {
    const existing = await Training.findOne({ where: { code: code.toUpperCase() } });
    if (existing) {
      throw new ConflictError('Training with this code already exists');
    }
  }

  // Validate training type if provided
  if (trainingType && !Object.values(TrainingType).includes(trainingType)) {
    throw new ValidationError(`Invalid training type. Must be one of: ${Object.values(TrainingType).join(', ')}`);
  }

  await training.update({
    name: name?.trim() || training.name,
    code: code?.toUpperCase().trim() || training.code,
    trainingType: trainingType || training.trainingType,
    validityDays: validityDays !== undefined ? Number(validityDays) : training.validityDays,
    durationDays: durationDays !== undefined ? Number(durationDays) : training.durationDays,
    isMandatory: isMandatory !== undefined ? isMandatory : training.isMandatory,
    description: description !== undefined ? description?.trim() : training.description,
  });

  logUserAction(req.user!.id, 'update', 'trainings', training.id);

  res.json({
    success: true,
    data: { training },
  });
});

/**
 * Delete training
 * DELETE /api/trainings/:id
 */
export const deleteTraining = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const training = await Training.findByPk(id, {
    include: ['batches'],
  });

  if (!training) {
    throw new NotFoundError('Training');
  }

  // Check if training has batches
  if ((training as any).batches?.length > 0) {
    throw new ValidationError('Cannot delete training with existing batches');
  }

  await training.destroy();

  logUserAction(req.user!.id, 'delete', 'trainings', parseInt(id));

  res.json({
    success: true,
    message: 'Training deleted successfully',
  });
});

export default {
  getAllTrainings,
  getTrainingById,
  createTraining,
  updateTraining,
  deleteTraining,
};
