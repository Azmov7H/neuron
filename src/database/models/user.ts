/**
 * User Model
 * Core user document with cognitive profile and progression data
 */

import mongoose, { Schema, Document } from 'mongoose';
import { IUser, CognitiveProfile, UserDomainStatus } from '@/types';
import bcrypt from 'bcryptjs';
import { config } from '@/config/env';

interface IUserDocument extends Omit<IUser, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  calculateRank(): string;
  toJSON(): any;
}

const CognitiveProfileSchema = new Schema<CognitiveProfile>(
  {
    learningStyle: {
      type: String,
      enum: ['visual', 'auditory', 'kinesthetic', 'reading-writing'],
      default: 'visual',
    },
    strengths: [String],
    weaknesses: [String],
    focusAreas: [String],
    adaptabilityScore: { type: Number, min: 0, max: 100, default: 50 },
    consistencyScore: { type: Number, min: 0, max: 100, default: 50 },
  },
  { _id: false }
);

const UserDomainStatusSchema = new Schema<UserDomainStatus>(
  {
    domain: String,
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    mastery: { type: Number, min: 0, max: 100, default: 0 },
    lastAccessed: Date,
    pathsCompleted: { type: Number, default: 0 },
    conceptsDiscovered: { type: Number, default: 0 },
  },
  { _id: false }
);

const userSchema = new Schema<IUserDocument>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username must not exceed 20 characters'],
      lowercase: true,
      match: [/^[a-z0-9_-]+$/, 'Username can only contain lowercase letters, numbers, underscores, and hyphens'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    avatar: String,

    // Progression
    rank: { type: String, default: 'Novice' },
    totalXP: { type: Number, default: 0, index: true },
    streak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: Date.now },

    // Cognitive State
    cognitiveProfile: {
      type: CognitiveProfileSchema,
      default: () => ({}),
    },
    domains: [UserDomainStatusSchema],
    preferredDomains: [String],

    // Behavioral
    learningHistory: [{ type: Schema.Types.ObjectId, ref: 'NeuralPath' }],
    discoveredConcepts: [String],
    savedResources: [String],
  },
  {
    timestamps: true,
  }
);

userSchema.index({ totalXP: -1 });
userSchema.index({ createdAt: -1 });

// Pre-save hook: hash password if modified
userSchema.pre<IUser & Document>('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(config.auth.bcryptRounds);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method: compare passwords
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method: calculate user rank based on XP
userSchema.methods.calculateRank = function (): string {
  const xp = this.totalXP;
  if (xp < 1000) return 'Novice';
  if (xp < 5000) return 'Explorer';
  if (xp < 15000) return 'Scholar';
  if (xp < 35000) return 'Sage';
  if (xp < 70000) return 'Architect';
  return 'Synthesist';
};

// Exclude sensitive fields on toJSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

export const User = mongoose.models.User as mongoose.Model<IUserDocument> || mongoose.model<IUserDocument>('User', userSchema);
