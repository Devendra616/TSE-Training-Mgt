import { Request, Response } from "express";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "../models/index.js";
import { config } from "../config/index.js";
import { cache } from "../config/redis.js";
import { AuthError, ValidationError } from "../utils/errors.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { logUserAction } from "../utils/logger.js";

const getJwtTtlSeconds = (): number => {
  const expiresIn = config.jwt.expiresIn;

  if (typeof expiresIn === "number") {
    return expiresIn;
  }

  const match = String(expiresIn)
    .trim()
    .match(/^(\d+)([smhd])?$/);

  if (!match) {
    return 60 * 60;
  }

  const value = Number(match[1]);
  const unit = match[2] || "s";
  const multipliers = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  };

  return value * multipliers[unit as keyof typeof multipliers];
};

const jwtTtlSeconds = getJwtTtlSeconds();

/**
 * Login user
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    throw new ValidationError("Email and password are required");
  }

  // Find user by email
  const user = await User.findOne({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    throw new AuthError("Invalid email or password");
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AuthError("Account is disabled. Please contact administrator.");
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw new AuthError("Invalid email or password");
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.secret as Secret,
    {
      expiresIn: config.jwt.expiresIn as SignOptions["expiresIn"],
    } as SignOptions,
  );

  // Update last login
  await user.update({ lastLoginAt: new Date() });

  // Log action
  logUserAction(user.id, "login", "auth");

  // Set HTTP-only cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    maxAge: jwtTtlSeconds * 1000,
  });

  res.json({
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
 * Logout user
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.token;

  if (token) {
    await cache.set(`blacklist:${token}`, true, jwtTtlSeconds);

    // Log action
    if (req.user) {
      logUserAction(req.user.id, "logout", "auth");
    }
  }

  // Clear cookie
  res.clearCookie("token");

  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

/**
 * Get current user
 * GET /api/auth/me
 */
export const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AuthError("Not authenticated");
    }

    const user = await User.findByPk(req.user.id, {
      attributes: [
        "id",
        "email",
        "fullName",
        "role",
        "signatureUrl",
        "lastLoginAt",
        "createdAt",
      ],
      include: ["employee"],
    });

    if (!user) {
      throw new AuthError("User not found");
    }

    res.json({
      success: true,
      data: { user },
    });
  },
);

/**
 * Change password
 * PUT /api/auth/password
 */
export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AuthError("Not authenticated");
    }

    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      throw new ValidationError(
        "Current password and new password are required",
      );
    }

    if (newPassword.length < 8) {
      throw new ValidationError("New password must be at least 8 characters");
    }

    // Find user
    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw new AuthError("User not found");
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isValidPassword) {
      throw new ValidationError("Current password is incorrect");
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await user.update({ passwordHash: newPasswordHash });

    // Log action
    logUserAction(user.id, "password_change", "auth");

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  },
);

export default { login, logout, getCurrentUser, changePassword };
