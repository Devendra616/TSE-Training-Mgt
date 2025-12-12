import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';
import { RateLimitError } from '../utils/errors.js';

/**
 * Rate limiter for login attempts
 * 5 attempts per 10 minutes by default
 */
export const loginLimiter = rateLimit({
  windowMs: config.rateLimit.login.windowMs,
  max: config.rateLimit.login.max,
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new RateLimitError('Too many login attempts. Please try again in 10 minutes.'));
  },
});

/**
 * Rate limiter for general API requests
 * 50 requests per minute by default
 */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.api.windowMs,
  max: config.rateLimit.api.max,
  message: 'Too many requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(new RateLimitError('Too many requests. Please slow down.'));
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
});

export default { loginLimiter, apiLimiter };
