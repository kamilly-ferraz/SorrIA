import { LoggerPort } from '@/application/ports/LoggerPort';
import { UseCaseContext } from '@/application/useCases/UseCaseContext';

export enum AuditAction {
  CREATE_PATIENT = 'CREATE_PATIENT',
  READ_PATIENT = 'READ_PATIENT',
  UPDATE_PATIENT = 'UPDATE_PATIENT',
  DELETE_PATIENT = 'DELETE_PATIENT',
  SEARCH_PATIENT = 'SEARCH_PATIENT',
  CREATE_CONSULTATION = 'CREATE_CONSULTATION',
  READ_CONSULTATION = 'READ_CONSULTATION',
  UPDATE_CONSULTATION = 'UPDATE_CONSULTATION',
  DELETE_CONSULTATION = 'DELETE_CONSULTATION',
  CREATE_APPOINTMENT = 'CREATE_APPOINTMENT',
  READ_APPOINTMENT = 'READ_APPOINTMENT',
  UPDATE_APPOINTMENT = 'UPDATE_APPOINTMENT',
  DELETE_APPOINTMENT = 'DELETE_APPOINTMENT',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  CROSS_TENANT_ACCESS_ATTEMPT = 'CROSS_TENANT_ACCESS_ATTEMPT',
  EXPORT_DATA = 'EXPORT_DATA',
  CHANGE_SETTINGS = 'CHANGE_SETTINGS',
}

export enum AuditSensitivity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface AuditEvent {
  correlationId: string;
  timestamp: Date;
  userId: string;
  tenantId: string;
  sessionId?: string;
  action: AuditAction;
  sensitivity: AuditSensitivity;
  resourceType: string;
  resourceId?: string;
  success: boolean;
  errorMessage?: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface AuditResult {
  auditId: string;
  recorded: boolean;
}

export class AuditService {
  private readonly logger: LoggerPort;

  constructor(logger: LoggerPort) {
    this.logger = logger;
  }

  async log(event: AuditEvent): Promise<AuditResult> {
    const auditId = this.generateAuditId();
    
    this.logger.info(`[AUDIT] ${event.action}`, {
      auditId,
      correlationId: event.correlationId,
      timestamp: event.timestamp.toISOString(),
      userId: event.userId,
      tenantId: event.tenantId,
      sessionId: event.sessionId,
      action: event.action,
      sensitivity: event.sensitivity,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      success: event.success,
      errorMessage: event.errorMessage,
      changes: this.sanitizeChanges(event.changes),
      metadata: event.metadata,
    });

    if (event.sensitivity === AuditSensitivity.HIGH || event.sensitivity === AuditSensitivity.CRITICAL) {
      this.logger.warn(`[AUDIT ${event.sensitivity.toUpperCase()}] ${event.action}`, {
        auditId,
        userId: event.userId,
        tenantId: event.tenantId,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
      });
    }

    return {
      auditId,
      recorded: true,
    };
  }

  createAuditBuilder(context: UseCaseContext, action: AuditAction, sensitivity: AuditSensitivity) {
    const startTime = new Date();
    
    return {
      withResource: (resourceType: string, resourceId?: string) => {
        return {
          withResult: (success: boolean, errorMessage?: string) => {
            return {
              withChanges: (changes?: Record<string, unknown>) => {
                return {
                  withMetadata: (metadata?: Record<string, unknown>) => {
                    return this.log({
                      correlationId: context.correlationId,
                      timestamp: startTime,
                      userId: context.userId,
                      tenantId: context.tenantId,
                      action,
                      sensitivity,
                      resourceType,
                      resourceId,
                      success,
                      errorMessage,
                      changes,
                      metadata,
                    });
                  },
                  execute: () => this.log({
                    correlationId: context.correlationId,
                    timestamp: startTime,
                    userId: context.userId,
                    tenantId: context.tenantId,
                    action,
                    sensitivity,
                    resourceType,
                    resourceId,
                    success,
                    errorMessage,
                  }),
                };
              },
            };
          },
        };
      },
    };
  }

  private sanitizeChanges(changes?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!changes) return undefined;

    const sensitiveFields = ['password', 'token', 'secret', 'cpf', 'creditCard', 'medicalHistory'];
    const sanitized = { ...changes };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }

  private generateAuditId(): string {
    return `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

export const createAuditService = (logger: LoggerPort): AuditService => {
  return new AuditService(logger);
};
