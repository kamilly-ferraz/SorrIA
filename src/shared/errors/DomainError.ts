export abstract class DomainError extends Error {
  public readonly code: string;
  public readonly metadata?: Record<string, unknown>;

  constructor(message: string, code: string, metadata?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.metadata = metadata;
    
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      metadata: this.metadata,
    };
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', metadata);
  }
}

export class EntityNotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} não encontrado(a) com ID: ${id}`, 'ENTITY_NOT_FOUND', { entity, id });
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'CONFLICT_ERROR', metadata);
  }
}

export class BusinessRuleError extends DomainError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'BUSINESS_RULE_ERROR', metadata);
  }
}
