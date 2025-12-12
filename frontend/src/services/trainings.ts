import api from './api';

export type TrainingType = 'BASIC' | 'REF' | 'COJ' | 'OTHR';

export interface Training {
  id: number;
  name: string;
  code: string;
  trainingType: TrainingType;
  validityDays: number;
  durationDays: number;
  isMandatory: boolean;
  description: string | null;
  createdAt: string;
}

export interface CreateTrainingData {
  name: string;
  code: string;
  trainingType: TrainingType;
  validityDays: number;
  durationDays: number;
  isMandatory: boolean;
  description?: string;
}

/**
 * Get all trainings
 */
export async function getTrainings(params?: {
  trainingType?: TrainingType;
  isMandatory?: boolean;
  search?: string;
}): Promise<Training[]> {
  const response = await api.get('/trainings', { params });
  return response.data.data.trainings;
}

/**
 * Get training by ID
 */
export async function getTraining(id: number): Promise<Training> {
  const response = await api.get(`/trainings/${id}`);
  return response.data.data.training;
}

/**
 * Create training
 */
export async function createTraining(data: CreateTrainingData): Promise<Training> {
  const response = await api.post('/trainings', data);
  return response.data.data.training;
}

/**
 * Update training
 */
export async function updateTraining(id: number, data: Partial<CreateTrainingData>): Promise<Training> {
  const response = await api.put(`/trainings/${id}`, data);
  return response.data.data.training;
}

/**
 * Delete training
 */
export async function deleteTraining(id: number): Promise<void> {
  await api.delete(`/trainings/${id}`);
}

export default {
  getTrainings,
  getTraining,
  createTraining,
  updateTraining,
  deleteTraining,
};
