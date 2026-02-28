export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeoutMs: number;
  onStateChange?: (state: CircuitState) => void;
  isFailure?: (error: unknown) => boolean;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private readonly config: Required<CircuitBreakerConfig>;

  constructor(config: CircuitBreakerConfig) {
    this.config = {
      failureThreshold: config.failureThreshold,
      successThreshold: config.successThreshold,
      timeoutMs: config.timeoutMs,
      onStateChange: config.onStateChange ?? (() => {}),
      isFailure: config.isFailure ?? this.defaultIsFailure,
    };
  }

  private defaultIsFailure(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('400') || message.includes('401') || 
          message.includes('403') || message.includes('404')) {
        return false;
      }
    }
    return true;
  }

  getState(): CircuitState {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.config.timeoutMs) {
        this.transitionTo(CircuitState.HALF_OPEN);
      }
    }
    return this.state;
  }

  private transitionTo(newState: CircuitState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.config.onStateChange(newState);
    }
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const currentState = this.getState();

    if (currentState === CircuitState.OPEN) {
      throw new Error('Circuit breaker is OPEN - service unavailable');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
        this.successCount = 0;
      }
    }
  }

  private onFailure(error: unknown): void {
    this.lastFailureTime = Date.now();
    
    if (this.config.isFailure(error)) {
      this.failureCount++;
      this.successCount = 0;

      if (this.state === CircuitState.HALF_OPEN) {
        this.transitionTo(CircuitState.OPEN);
      } else if (this.failureCount >= this.config.failureThreshold) {
        this.transitionTo(CircuitState.OPEN);
      }
    }
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.config.onStateChange(CircuitState.CLOSED);
  }

  getMetrics() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

export const CircuitBreakers = {
  forExternalAPI(): CircuitBreaker {
    return new CircuitBreaker({
      failureThreshold: 5,
      successThreshold: 2,
      timeoutMs: 30000,
    });
  },

  forDatabase(): CircuitBreaker {
    return new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      timeoutMs: 10000,
    });
  },

  forInternal(): CircuitBreaker {
    return new CircuitBreaker({
      failureThreshold: 10,
      successThreshold: 3,
      timeoutMs: 60000,
    });
  },
};

export function withCircuitBreaker<T>(
  fn: () => Promise<T>,
  config?: Partial<CircuitBreakerConfig>
): () => Promise<T> {
  const breaker = new CircuitBreaker({
    failureThreshold: config?.failureThreshold ?? 5,
    successThreshold: config?.successThreshold ?? 2,
    timeoutMs: config?.timeoutMs ?? 30000,
    onStateChange: config?.onStateChange,
    isFailure: config?.isFailure,
  });

  return () => breaker.execute(fn);
}
