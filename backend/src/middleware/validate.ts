import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors.js';

/**
 * Validation middleware
 * Checks for validation errors from express-validator
 */
export function validateRequest(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: (err as any).path || 'unknown',
      message: err.msg,
    }));

    throw new ValidationError('Validation failed', errorMessages);
  }

  next();
}

export default { validateRequest };
