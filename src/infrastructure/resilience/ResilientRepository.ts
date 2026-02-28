import { CircuitBreaker, CircuitState, CircuitBreakerConfig } from './CircuitBreaker';
import { RetryPolicy, RetryPolicyConfig, RetryExhaustedError } from './RetryPolicy';
import { logger } from '@/lib/Logger';

export interface ResilientRepositoryConfig {
  maxAttempts?: number;
  timeoutMs?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  failureThreshold?: number;
  circuitBreakerTimeoutMs?: number;
  enableLogging?: boolean;
  logPrefix?: string;
}

export class ResilientTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Operation timed out after ${timeoutMs}ms`);
    this.name = 'ResilientTimeoutError';
  }
}

export class CircuitBreakerOpenError extends Error {
  constructor(message = 'Circuit breaker is OPEN - service unavailable') {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

export interface ResilientResult<T> {
  success: boolean;
  value?: T;
  error?: unknown;
  attempts: number;
  durationMs: number;
  circuitBreakerState?: CircuitState;
}

export class ResilientRepository<T extends object = Record<string, unknown>> {
  private readonly retryPolicy: RetryPolicy;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly target: T;
  private readonly config: Required<ResilientRepositoryConfig>;
  private readonly logPrefix: string;

  constructor(target: T, config: ResilientRepositoryConfig = {}) {
    this.target = target;
    this.config = {
      maxAttempts: config.maxAttempts ?? 3,
      timeoutMs: config.timeoutMs ?? 5000,
      initialDelayMs: config.initialDelayMs ?? 1000,
      maxDelayMs: config.maxDelayMs ?? 5000,
      failureThreshold: config.failureThreshold ?? 5,
      circuitBreakerTimeoutMs: config.circuitBreakerTimeoutMs ?? 30000,
      enableLogging: config.enableLogging ?? true,
      logPrefix: config.logPrefix ?? 'ResilientRepository',
    };
    this.logPrefix = this.config.logPrefix;

    const retryConfig: RetryPolicyConfig = {
      maxAttempts: this.config.maxAttempts,
      initialDelayMs: this.config.initialDelayMs,
      maxDelayMs: this.config.maxDelayMs,
      backoffMultiplier: 2,
      jitter: true,
      timeoutMs: this.config.timeoutMs,
      shouldRetry: this.shouldRetry.bind(this),
    };
    this.retryPolicy = new RetryPolicy(retryConfig);

    const breakerConfig: CircuitBreakerConfig = {
      failureThreshold: this.config.failureThreshold,
      successThreshold: 2,
      timeoutMs: this.config.circuitBreakerTimeoutMs,
      onStateChange: this.onCircuitStateChange.bind(this),
      isFailure: this.shouldRetry.bind(this),
    };
    this.circuitBreaker = new CircuitBreaker(breakerConfig);
  }

  private shouldRetry(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('400') || message.includes('401') || 
          message.includes('403') || message.includes('404') ||
          message.includes('validation') || message.includes('duplicate')) {
        return false;
      }
      if (message.includes('network') || message.includes('fetch') ||
          message.includes('timeout') || message.includes('econnrefused') ||
          message.includes('enotfound') || message.includes('socket')) {
        return true;
      }
    }
    return true;
  }

  private onCircuitStateChange(newState: CircuitState): void {
    if (this.config.enableLogging) {
      logger.warn(`[${this.logPrefix}] Circuit Breaker state changed`, { 
        state: newState,
        target: this.config.logPrefix,
      });
    }
  }

  async execute<R = unknown>(methodName: keyof T, ...args: unknown[]): Promise<R> {
    const startTime = Date.now();
    const method = (this.target as Record<string, unknown>)[String(methodName)] as (...args: unknown[]) => Promise<R>;
    const operationName = `${String(methodName)}`;
    
    if (this.config.enableLogging) {
      logger.debug(`[${this.logPrefix}] Executing ${operationName}`, { 
        args: this.sanitizeArgs(args),
        timeoutMs: this.config.timeoutMs,
        maxAttempts: this.config.maxAttempts,
      });
    }

    try {
      const result = await this.circuitBreaker.execute(async () => {
        const retryResult = await this.retryPolicy.execute(async () => {
          return await method.apply(this.target, args);
        });

        if (!retryResult.success) {
          throw retryResult.error ?? new Error('Unknown error');
        }
        return retryResult.value;
      });

      const durationMs = Date.now() - startTime;
      
      if (this.config.enableLogging) {
        logger.info(`[${this.logPrefix}] ${operationName} succeeded`, { 
          attempts: this.config.maxAttempts,
          durationMs,
          circuitState: this.circuitBreaker.getState(),
        });
      }

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const circuitState = this.circuitBreaker.getState();
      const metrics = this.circuitBreaker.getMetrics();

      if (this.config.enableLogging) {
        const isNetworkError = error instanceof Error && 
          (error.message.includes('network') || error.message.includes('fetch'));
        
        if (isNetworkError) {
          logger.warn(`[${this.logPrefix}] ${operationName} failed`, {
            error: error instanceof Error ? error.message : String(error),
            errorType: error?.constructor?.name,
            attempts: this.config.maxAttempts,
            durationMs,
            circuitState,
            circuitMetrics: metrics,
            isRetryExhausted: error instanceof RetryExhaustedError,
            isCircuitOpen: circuitState === CircuitState.OPEN,
          });
        } else {
          logger.error(`[${this.logPrefix}] ${operationName} failed`, 
            error instanceof Error ? error : undefined,
            {
              error: error instanceof Error ? error.message : String(error),
              errorType: error?.constructor?.name,
              attempts: this.config.maxAttempts,
              durationMs,
              circuitState,
              circuitMetrics: metrics,
              isRetryExhausted: error instanceof RetryExhaustedError,
              isCircuitOpen: circuitState === CircuitState.OPEN,
            }
          );
        }
      }

      if (error instanceof RetryExhaustedError) {
        const enrichedError = new Error(
          `Failed after ${error.attempts} attempts: ${error.lastError}`
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (enrichedError as any).originalError = error;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (enrichedError as any).attempts = error.attempts;
        throw enrichedError;
      }

      if (error instanceof Error && error.message.includes('Circuit breaker is OPEN')) {
        throw new CircuitBreakerOpenError();
      }

      throw error;
    }
  }

  async call<R = unknown>(methodName: keyof T): Promise<R> {
    return this.execute<R>(methodName);
  }

  getCircuitBreakerMetrics() {
    return this.circuitBreaker.getMetrics();
  }

  getCircuitBreakerState(): CircuitState {
    return this.circuitBreaker.getState();
  }

  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
    if (this.config.enableLogging) {
      logger.info(`[${this.logPrefix}] Circuit breaker manually reset`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private sanitizeArgs(args: any[]): any[] {
    const sensitiveFields = ['password', 'token', 'secret', 'cpf', 'creditCard'];
    return args.map(arg => {
      if (typeof arg !== 'object' || arg === null) return arg;
      const sanitized = { ...arg };
      for (const field of sensitiveFields) {
        if (field in sanitized) sanitized[field] = '***REDACTED***';
      }
      return sanitized;
    });
  }

  getOriginal(): T {
    return this.target;
  }
}

export const ResilientRepositoryFactory = {
  create<T extends object>(target: T, prefix?: string): ResilientRepository<T> {
    return new ResilientRepository(target, {
      maxAttempts: 3,
      timeoutMs: 5000,
      initialDelayMs: 1000,
      maxDelayMs: 5000,
      failureThreshold: 5,
      circuitBreakerTimeoutMs: 30000,
      logPrefix: prefix ?? 'Repository',
    });
  },

  createForDatabase<T extends object>(target: T, prefix?: string): ResilientRepository<T> {
    return new ResilientRepository(target, {
      maxAttempts: 3,
      timeoutMs: 5000,
      initialDelayMs: 500,
      maxDelayMs: 3000,
      failureThreshold: 3,
      circuitBreakerTimeoutMs: 15000,
      logPrefix: prefix ?? 'Database',
    });
  },

  createForInternal<T extends object>(target: T, prefix?: string): ResilientRepository<T> {
    return new ResilientRepository(target, {
      maxAttempts: 3,
      timeoutMs: 5000,
      initialDelayMs: 2000,
      maxDelayMs: 10000,
      failureThreshold: 10,
      circuitBreakerTimeoutMs: 60000,
      logPrefix: prefix ?? 'Internal',
    });
  },
};

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('network') || 
           message.includes('fetch') || 
           message.includes('timeout') ||
           message.includes('econnrefused');
  }
  return false;
}

export function isCircuitBreakerOpen(error: unknown): boolean {
  return error instanceof CircuitBreakerOpenError ||
         (error instanceof Error && error.message.includes('Circuit breaker is OPEN'));
}
