import { LogLevel } from '@/lib/Logger';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  tenantId?: string;
  correlationId?: string;
}

export interface LoggerPort {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
  child(additionalContext: Record<string, unknown>): LoggerPort;
  setContext(context: Record<string, unknown>): void;
  clearContext(): void;
}

export class UseCaseLogger implements LoggerPort {
  private readonly baseLogger: LoggerPort;
  private readonly useCaseName: string;
  private readonly initialContext: Record<string, unknown>;

  constructor(
    baseLogger: LoggerPort,
    options: {
      useCaseName: string;
      tenantId?: string;
      correlationId?: string;
    }
  ) {
    this.baseLogger = baseLogger;
    this.useCaseName = options.useCaseName;
    this.initialContext = {
      useCase: options.useCaseName,
      ...(options.tenantId && { tenantId: options.tenantId }),
      ...(options.correlationId && { correlationId: options.correlationId }),
    };
  }

  private addContext(context?: Record<string, unknown>): Record<string, unknown> {
    return {
      ...this.initialContext,
      ...context,
    };
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.baseLogger.debug(message, this.addContext(context));
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.baseLogger.info(message, this.addContext(context));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.baseLogger.warn(message, this.addContext(context));
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.baseLogger.error(message, error, this.addContext(context));
  }

  child(additionalContext: Record<string, unknown>): LoggerPort {
    return this.baseLogger.child({
      ...this.initialContext,
      ...additionalContext,
    });
  }

  setContext(context: Record<string, unknown>): void {
    this.baseLogger.setContext({
      ...this.initialContext,
      ...context,
    });
  }

  clearContext(): void {
    this.baseLogger.setContext(this.initialContext);
  }

  logStart(input?: Record<string, unknown>): void {
    this.info(`[${this.useCaseName}] Iniciando`, { input: this.sanitizeInput(input) });
  }

  logEnd(durationMs: number, result?: Record<string, unknown>): void {
    this.info(`[${this.useCaseName}] Concluído em ${durationMs}ms`, {
      durationMs,
      result: this.sanitizeInput(result),
    });
  }

  logError(error: Error, durationMs?: number): void {
    this.error(
      `[${this.useCaseName}] Erro após ${durationMs ?? 0}ms`,
      error,
      { durationMs }
    );
  }

  private sanitizeInput(input?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!input) return undefined;

    const sensitiveFields = ['password', 'token', 'secret', 'cpf', 'creditCard'];
    const sanitized = { ...input };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
