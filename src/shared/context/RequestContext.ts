function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface RequestContextData {
  correlationId: string;
  tenantId?: string;
  userId?: string;
  requestId?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export class RequestContext {
  private static currentContext: RequestContextData | null = null;

  static create(options?: {
    tenantId?: string;
    userId?: string;
    requestId?: string;
    correlationId?: string;
    metadata?: Record<string, unknown>;
  }): RequestContextData {
    const context: RequestContextData = {
      correlationId: options?.correlationId ?? RequestContext.generateCorrelationId(),
      tenantId: options?.tenantId,
      userId: options?.userId,
      requestId: options?.requestId,
      timestamp: new Date(),
      metadata: options?.metadata,
    };

    RequestContext.currentContext = context;
    return context;
  }

  static generateCorrelationId(): string {
    return generateUUID();
  }

  static getCurrentContext(): RequestContextData | null {
    return RequestContext.currentContext;
  }

  static getCorrelationId(): string {
    return RequestContext.currentContext?.correlationId ?? RequestContext.generateCorrelationId();
  }

  static getTenantId(): string | undefined {
    return RequestContext.currentContext?.tenantId;
  }

  static getUserId(): string | undefined {
    return RequestContext.currentContext?.userId;
  }

  static updateContext(updates: Partial<Omit<RequestContextData, 'correlationId' | 'timestamp'>>): void {
    if (RequestContext.currentContext) {
      RequestContext.currentContext = {
        ...RequestContext.currentContext,
        ...updates,
      };
    }
  }

  static clear(): void {
    RequestContext.currentContext = null;
  }

  static runWithContext<T>(
    context: RequestContextData,
    fn: () => T
  ): T {
    const previousContext = RequestContext.currentContext;
    RequestContext.currentContext = context;
    
    try {
      return fn();
    } finally {
      RequestContext.currentContext = previousContext;
    }
  }

  static async runWithContextAsync<T>(
    context: RequestContextData,
    fn: () => Promise<T>
  ): Promise<T> {
    const previousContext = RequestContext.currentContext;
    RequestContext.currentContext = context;
    
    try {
      return await fn();
    } finally {
      RequestContext.currentContext = previousContext;
    }
  }
}

export function useRequestContext(): {
  correlationId: string;
  tenantId: string | undefined;
  userId: string | undefined;
  requestId: string | undefined;
} {
  const context = RequestContext.getCurrentContext();
  
  return {
    correlationId: context?.correlationId ?? RequestContext.generateCorrelationId(),
    tenantId: context?.tenantId,
    userId: context?.userId,
    requestId: context?.requestId,
  };
}
