/**
 * Auth Service
 * Authentication business logic — register, login, token refresh
 */

import { User } from '@/database/models/user';
import { generateTokens, verifyRefreshToken } from '@/lib/auth/jwt';
import { AppError } from '@/types';
import { RegisterInput, LoginInput } from '@/validations/schemas';

export class AuthService {
  /**
   * Register new user
   */
  static async register(input: RegisterInput) {
    const normalizedEmail = input.email.trim().toLowerCase();
    const normalizedUsername = input.username.trim().toLowerCase();

    // Check for duplicates
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });

    if (existingUser) {
      const field = existingUser.email === normalizedEmail ? 'email' : 'username';
      throw new AppError(409, `This ${field} is already registered`, 'USER_EXISTS');
    }

    // Build user document — password hashed via pre-save hook
    const user = new User({
      username: normalizedUsername,
      email: normalizedEmail,
      password: input.password,
      // Store learning path selection if provided
      ...(input.preferredDomain ? { preferredDomains: [input.preferredDomain] } : {}),
    });

    await user.save();

    // Generate token pair
    const tokens = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
    });

    return {
      tokens,
      user: user.toJSON(),
    };
  }

  /**
   * Login user — accepts email or username
   */
  static async login(input: LoginInput) {
    const normalizedIdentifier = input.email.trim().toLowerCase();

    const user = await User.findOne({
      $or: [{ email: normalizedIdentifier }, { username: normalizedIdentifier }],
    }).select('+password');

    if (!user) {
      // Use vague message to prevent user enumeration
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const isPasswordValid = await user.comparePassword(input.password);

    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Update last active timestamp
    user.lastActiveDate = new Date();
    await user.save();

    const tokens = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
    });

    return {
      tokens,
      user: user.toJSON(),
    };
  }

  /**
   * Refresh access token using a valid refresh token
   */
  static async refreshToken(refreshToken: string) {
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      throw new AppError(401, 'Invalid or expired refresh token', 'INVALID_TOKEN');
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new AppError(401, 'User not found', 'USER_NOT_FOUND');
    }

    return generateTokens({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
    });
  }

  /**
   * Get user context by ID
   */
  static async getUserContext(userId: string) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    return user;
  }
}
