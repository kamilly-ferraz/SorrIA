export abstract class InfrastructureError extends Error {
  public readonly code: string;
  public readonly service: string;
  public readonly statusCode?: number;
  public override readonly cause?: Error;
  public readonly metadata?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    service: string,
    statusCode?: number,
    cause?: Error,
    metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.service = service;
    this.statusCode = statusCode;
    this.cause = cause;
    this.metadata = metadata;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class DatabaseError extends InfrastructureError {
  constructor(
    message: string,
    cause?: Error,
    metadata?: Record<string, unknown>
  ) {
    super(
      message,
      'DATABASE_ERROR',
      'postgresql',
      undefined,
      cause,
      metadata
    );
  }
}

export class DatabaseConnectionError extends DatabaseError {
  constructor(database: string = 'supabase', cause?: Error) {
    super(
      `Falha ao conectar ao banco de dados: ${database}`,
      cause,
      { database }
    );
  }
}

export class DatabaseQueryError extends DatabaseError {
  constructor(query: string, cause?: Error) {
    super(
      `Erro ao executar query: ${query.substring(0, 50)}...`,
      cause,
      { query: query.substring(0, 100) }
    );
  }
}

export class ExternalAPIError extends InfrastructureError {
  constructor(
    service: string,
    message: string,
    statusCode?: number,
    cause?: Error,
    metadata?: Record<string, unknown>
  ) {
    super(
      `Erro na API ${service}: ${message}`,
      'EXTERNAL_API_ERROR',
      service,
      statusCode,
      cause,
      metadata
    );
  }
}

export class TimeoutError extends InfrastructureError {
  constructor(operation: string, timeoutMs: number) {
    super(
      `Timeout após ${timeoutMs}ms na operação: ${operation}`,
      'TIMEOUT_ERROR',
      operation,
      408,
      undefined,
      { operation, timeoutMs }
    );
  }
}

export class NetworkError extends InfrastructureError {
  constructor(message: string, cause?: Error) {
    super(
      `Erro de rede: ${message}`,
      'NETWORK_ERROR',
      'network',
      undefined,
      cause
    );
  }
}

export class RateLimitError extends InfrastructureError {
  constructor(service: string, retryAfter?: number) {
    super(
      `Rate limit excedido para ${service}`,
      'RATE_LIMIT_ERROR',
      service,
      429,
      undefined,
      { retryAfter }
    );
  }
}
