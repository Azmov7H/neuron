/**
 * Audit Log Model
 * Immutable, append-only record of privileged actions for RBAC compliance.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';
import { Role } from '@/types';

export interface IAuditLog {
  _id?: Types.ObjectId;
  actorId: Types.ObjectId | string;
  actorRole: Role;
  action: string; // e.g. "concept.create", "concept.publish"
  entity: string; // collection / kind, e.g. "Concept"
  entityId?: string;
  ip?: string;
  userAgent?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export type IAuditLogDocument = IAuditLog & Document;

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorRole: {
      type: String,
      enum: ['user', 'contributor', 'curator', 'admin'],
      required: true,
      index: true,
    },
    action: { type: String, required: true, index: true },
    entity: { type: String, required: true, index: true },
    entityId: { type: String, index: true },
    ip: { type: String },
    userAgent: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Audit logs are write-once; TTL optional for retention policies.
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });

export const AuditLog = mongoose.models.AuditLog as mongoose.Model<IAuditLogDocument> ||
  mongoose.model<IAuditLogDocument>('AuditLog', auditLogSchema);
