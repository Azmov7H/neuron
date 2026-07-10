/**
 * Audit Service
 * Append-only audit logging for privileged (curator/admin) mutations.
 * Never throws — failures are logged but do not break the request.
 */

import { AuditLog } from '@/database/models/audit-log';
import { Role } from '@/types';
import { logger } from '@/lib/logger';
import type { NextRequest } from 'next/server';

export interface AuditContext {
  actorId: string;
  actorRole: Role;
  ip?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Extract a best-effort audit context from a request.
   */
  static fromRequest(request: NextRequest, actorId: string, actorRole: Role): AuditContext {
    return {
      actorId,
      actorRole,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? request.headers.get('x-real-ip') ?? undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
    };
  }

  /**
   * Write an audit entry. Fire-and-forget safe.
   */
  static async log(params: {
    context: AuditContext;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await AuditLog.create({
        actorId: params.context.actorId,
        actorRole: params.context.actorRole,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        ip: params.context.ip,
        userAgent: params.context.userAgent,
        metadata: params.metadata ?? {},
        createdAt: new Date(),
      });
    } catch (error) {
      logger.error('[Audit] Failed to persist audit log', error);
    }
  }

  /**
   * Query audit entries with pagination.
   */
  static async query(filters: {
    actorId?: string;
    action?: string;
    entity?: string;
    entityId?: string;
    from?: Date;
    to?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const page = filters.page ?? 1;
    const pageSize = Math.min(filters.pageSize ?? 50, 200);
    const query: Record<string, unknown> = {};

    if (filters.actorId) query.actorId = filters.actorId;
    if (filters.action) query.action = filters.action;
    if (filters.entity) query.entity = filters.entity;
    if (filters.entityId) query.entityId = filters.entityId;

    if (filters.from || filters.to) {
      query.createdAt = {};
      if (filters.from) (query.createdAt as Record<string, unknown>).$gte = filters.from;
      if (filters.to) (query.createdAt as Record<string, unknown>).$lte = filters.to;
    }

    const [items, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
