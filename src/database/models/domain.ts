import mongoose, { Schema, Document } from 'mongoose';

export interface IDomain extends Document {
  slug: string;
  name: string;
  description: string;
  theme: string;
  iconName: string;
  tags: string[];
  relatedDomains: string[];
  gradient?: string;
  glow?: string;
  isActive: boolean;
}

const domainSchema = new Schema<IDomain>(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    theme: { type: String, required: true },
    iconName: { type: String, required: true },
    tags: [String],
    relatedDomains: [String],
    gradient: String,
    glow: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Domain =
  mongoose.models.Domain || mongoose.model<IDomain>('Domain', domainSchema);
