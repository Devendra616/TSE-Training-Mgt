import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { User, UserRole } from '../models/index.js';
import { AuthError, ForbiddenError } from '../utils/errors.js';
import { cache } from '../config/redis.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: UserRole;
        fullName: string;
      };
    }
  }
}

interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

/**
 * JWT Authentication Middleware
 * Validates token from HTTP-only cookie
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from cookie
    const token = req.cookies?.token;

    if (!token) {
      throw new AuthError('Authentication required');
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Check if token is blacklisted (logout)
    const isBlacklisted = await cache.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new AuthError('Token has been invalidated');
    }

    // Fetch user from database
    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'email', 'role', 'fullName', 'isActive'],
    });

    if (!user || !user.isActive) {
      throw new AuthError('User not found or inactive');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AuthError('Token expired'));
    } else {
      next(error);
    }
  }
}

/**
 * Role-based access control middleware
 * Checks if user has one of the allowed roles
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthError('Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError(`Access denied. Required roles: ${allowedRoles.join(', ')}`));
      return;
    }

    next();
  };
}

/**
 * Optional authentication - doesn't throw if no token
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.token;

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      const user = await User.findByPk(decoded.userId, {
        attributes: ['id', 'email', 'role', 'fullName', 'isActive'],
      });

      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
        };
      }
    }

    next();
  } catch {
    // Token is invalid, but we don't throw - just continue without user
    next();
  }
}

export default { authenticate, authorize, optionalAuth };
