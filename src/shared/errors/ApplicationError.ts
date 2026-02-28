export abstract class ApplicationError extends Error {
  public readonly code: string;
  public override readonly cause?: Error;
  public readonly metadata?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    cause?: Error,
    metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.cause = cause;
    this.metadata = metadata;
    
    Error.captureStackTrace(this, this.constructor);
  }

}

export class UseCaseError extends ApplicationError {
  constructor(message: string, cause?: Error, metadata?: Record<string, unknown>) {
    super(message, 'USE_CASE_ERROR', cause, metadata);
  }
}

export class DependencyError extends ApplicationError {
  constructor(dependency: string, cause?: Error) {
    super(
      `Dependência não resolvida: ${dependency}`,
      'DEPENDENCY_ERROR',
      cause,
      { dependency }
    );
  }
}

export class InvalidStateError extends ApplicationError {
  constructor(currentState: string, expectedState: string) {
    super(
      `Estado inválido: esperado ${expectedState}, atual ${currentState}`,
      'INVALID_STATE',
      undefined,
      { currentState, expectedState }
    );
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Acesso não autorizado') {
    super(message, 'AUTHORIZATION_ERROR');
  }
}

export class InputValidationError extends ApplicationError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super(message, 'INPUT_VALIDATION_ERROR', undefined, metadata);
  }
}
