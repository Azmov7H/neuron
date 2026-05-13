/**
 * Auth Service
 * Authentication business logic and user registration/login
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
    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email: input.email }, { username: input.username }],
    });

    if (existingUser) {
      const field = existingUser.email === input.email ? 'email' : 'username';
      throw new AppError(409, `This ${field} is already registered`, 'USER_EXISTS');
    }

    // Create new user
    const user = new User({
      username: input.username,
      email: input.email,
      password: input.password,
    });

    await user.save();

    // Generate tokens
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
   * Login user
   */
  static async login(input: LoginInput) {
    // Find user by email
    const user = await User.findOne({ email: input.email }).select('+password');

    if (!user) {
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(input.password);

    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Update last active date
    user.lastActiveDate = new Date();
    await user.save();

    // Generate tokens
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
   * Refresh access token
   */
  static async refreshToken(refreshToken: string) {
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      throw new AppError(401, 'Invalid refresh token', 'INVALID_TOKEN');
    }

    // Verify user still exists
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new AppError(401, 'User not found', 'USER_NOT_FOUND');
    }

    // Generate new tokens
    const tokens = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
    });

    return tokens;
  }

  /**
   * Get user context
   */
  static async getUserContext(userId: string) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
    }

    return user;
  }
}
