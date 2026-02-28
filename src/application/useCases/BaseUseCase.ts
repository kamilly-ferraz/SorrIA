import { Result, ok, err } from '@/shared/core/Result';
import { AppError } from '@/shared/errors';
import { LoggerPort } from '@/application/ports/LoggerPort';
import { UseCaseContext } from './UseCaseContext';
import { AuthorizationService } from './AuthorizationService';
import { Permission } from './UseCaseContext';

export interface UseCaseDependencies {
  logger: LoggerPort;
  authorizationService?: AuthorizationService;
}

export type UseCaseInput = Record<string, unknown>;
export type UseCaseOutput<T> = T;

export type PerformanceClassification = 'OK' | 'WARNING' | 'SLOW_OPERATION';

export function classifyPerformance(durationMs: number): PerformanceClassification {
  if (durationMs < 200) return 'OK';
  if (durationMs <= 1000) return 'WARNING';
  return 'SLOW_OPERATION';
}

export abstract class BaseUseCase<TInput extends UseCaseInput, TOutput, TError extends AppError = AppError> {
  protected readonly logger: LoggerPort;
  protected readonly authorizationService: AuthorizationService;
  protected readonly useCaseName: string;

  constructor(
    protected readonly deps: UseCaseDependencies,
    useCaseName: string
  ) {
    this.logger = deps.logger;
    this.authorizationService = deps.authorizationService || new AuthorizationService();
    this.useCaseName = useCaseName;
  }

  abstract execute(input: TInput, context: UseCaseContext): Promise<Result<TOutput, TError>>;

  protected getRequiredPermissions(): Permission[] {
    return [];
  }

  protected validateInput(input: TInput): Result<void, TError> | null {
    return null;
  }

  protected async executeWithLogging(
    input: TInput,
    context: UseCaseContext,
    executeLogic: (input: TInput) => Promise<Result<TOutput, TError>>
  ): Promise<Result<TOutput, TError>> {
    const startTime = Date.now();
    const correlationId = context.correlationId;

    const useCaseLogger = this.logger.child({
      useCase: this.useCaseName,
      tenantId: context.tenantId,
      userId: context.userId,
      correlationId,
    });

    useCaseLogger.info(`[${this.useCaseName}] Starting`, {
      input: this.sanitizeInput(input),
    });

    try {
      const validationResult = this.validateInput(input);
      if (validationResult && validationResult.isErr()) {
        useCaseLogger.warn(`[${this.useCaseName}] Validation failed`, {
          error: validationResult.unwrapErr().message,
        });
        return err(validationResult.unwrapErr());
      }

      const permissions = this.getRequiredPermissions();
      for (const permission of permissions) {
        const authResult = this.authorizationService.can(context, permission);
        if (authResult.isErr()) {
          useCaseLogger.warn(`[${this.useCaseName}] Access denied`, {
            permission,
            userId: context.userId,
          });
          return err(authResult.unwrapErr() as TError);
        }
      }

      const result = await executeLogic(input);

      const durationMs = Date.now() - startTime;
      const classification = classifyPerformance(durationMs);

      const metrics = {
        durationMs,
        classification,
        useCase: this.useCaseName,
        tenantId: context.tenantId,
        correlationId,
        timestamp: new Date().toISOString(),
      };

      if (result.isOk()) {
        useCaseLogger.info(`[${this.useCaseName}] Completed`, { ...metrics });
      } else {
        useCaseLogger.warn(`[${this.useCaseName}] Failed`, {
          error: result.unwrapErr().message,
          ...metrics,
        });
      }

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const classification = classifyPerformance(durationMs);

      const metrics = {
        durationMs,
        classification,
        useCase: this.useCaseName,
        tenantId: context.tenantId,
        correlationId,
        timestamp: new Date().toISOString(),
      };

      useCaseLogger.error(
        `[${this.useCaseName}] Unexpected error`,
        error instanceof Error ? error : new Error(String(error)),
        metrics
      );
      return err(error as TError);
    }
  }

  protected sanitizeInput(input: TInput): Record<string, unknown> {
    const sensitiveFields = ['password', 'token', 'secret', 'cpf', 'creditCard'];
    const inputObj = input as unknown as Record<string, unknown>;
    const sanitized = { ...inputObj };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
