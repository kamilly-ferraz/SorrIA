export interface RetryPolicyConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  timeoutMs?: number;
  shouldRetry?: (error: unknown) => boolean;
}

export interface RetryResult<T> {
  success: boolean;
  value?: T;
  error?: unknown;
  attempts: number;
  totalDurationMs: number;
}

export class RetryExhaustedError extends Error {
  public readonly attempts: number;
  public readonly lastError: unknown;

  constructor(attempts: number, lastError: unknown) {
    super(`Retry exhausted after ${attempts} attempts`);
    this.name = 'RetryExhaustedError';
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

export class RetryPolicy {
  private readonly config: Required<RetryPolicyConfig>;

  constructor(config: RetryPolicyConfig) {
    this.config = {
      maxAttempts: config.maxAttempts,
      initialDelayMs: config.initialDelayMs,
      maxDelayMs: config.maxDelayMs,
      backoffMultiplier: config.backoffMultiplier ?? 2,
      jitter: config.jitter ?? true,
      timeoutMs: config.timeoutMs ?? 0,
      shouldRetry: config.shouldRetry ?? this.defaultShouldRetry,
    };
  }

  private defaultShouldRetry(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('400') || message.includes('401') || 
          message.includes('403') || message.includes('404') ||
          message.includes('validation')) {
        return false;
      }
    }
    return true;
  }

  private calculateDelay(attempt: number): number {
    const exponentialDelay = this.config.initialDelayMs * 
      Math.pow(this.config.backoffMultiplier, attempt - 1);
    
    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelayMs);
    
    if (this.config.jitter) {
      const jitterAmount = cappedDelay * 0.25 * Math.random();
      return Math.floor(cappedDelay + jitterAmount);
    }
    
    return Math.floor(cappedDelay);
  }

  async execute<T>(fn: () => Promise<T>): Promise<RetryResult<T>> {
    const startTime = Date.now();
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        let result: T;
        if (this.config.timeoutMs) {
          result = await this.executeWithTimeout(fn, this.config.timeoutMs);
        } else {
          result = await fn();
        }

        return {
          success: true,
          value: result,
          attempts: attempt,
          totalDurationMs: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error;

        if (attempt < this.config.maxAttempts && this.config.shouldRetry(error)) {
          const delay = this.calculateDelay(attempt);
          await this.sleep(delay);
          continue;
        }

        return {
          success: false,
          error: lastError,
          attempts: attempt,
          totalDurationMs: Date.now() - startTime,
        };
      }
    }

    return {
      success: false,
      error: lastError,
      attempts: this.config.maxAttempts,
      totalDurationMs: Date.now() - startTime,
    };
  }

  private async executeWithTimeout<T>(
    fn: () => Promise<T>, 
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      fn()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static forNetworkErrors(): RetryPolicy {
    return new RetryPolicy({
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 5000,
      backoffMultiplier: 2,
      jitter: true,
      timeoutMs: 10000,
    });
  }

  static forDatabase(): RetryPolicy {
    return new RetryPolicy({
      maxAttempts: 3,
      initialDelayMs: 500,
      maxDelayMs: 3000,
      backoffMultiplier: 2,
      jitter: true,
      timeoutMs: 30000,
    });
  }

  static forBackground(): RetryPolicy {
    return new RetryPolicy({
      maxAttempts: 5,
      initialDelayMs: 2000,
      maxDelayMs: 60000,
      backoffMultiplier: 2,
      jitter: true,
    });
  }
}

export function withRetry<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryPolicyConfig>
): Promise<T> {
  const policy = new RetryPolicy({
    maxAttempts: config?.maxAttempts ?? 3,
    initialDelayMs: config?.initialDelayMs ?? 1000,
    maxDelayMs: config?.maxDelayMs ?? 5000,
    backoffMultiplier: config?.backoffMultiplier ?? 2,
    jitter: config?.jitter ?? true,
    timeoutMs: config?.timeoutMs,
    shouldRetry: config?.shouldRetry,
  });

  return policy.execute(fn).then(result => {
    if (result.success) {
      return result.value as T;
    }
    throw new RetryExhaustedError(result.attempts, result.error);
  });
}
