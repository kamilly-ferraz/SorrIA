import { logger, LogLevel } from './Logger';

export enum ErrorCode {
  UNKNOWN = 'UNKNOWN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  PATIENT_NOT_FOUND = 'PATIENT_NOT_FOUND',
  APPOINTMENT_NOT_FOUND = 'APPOINTMENT_NOT_FOUND',
  CONSULTATION_NOT_FOUND = 'CONSULTATION_NOT_FOUND',
  
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 500,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    
    if (import.meta.env.DEV) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
    };
  }
}

class ErrorHandler {
  private errorCallbacks: Array<(error: Error, context?: Record<string, unknown>) => void> = [];

  onError(callback: (error: Error, context?: Record<string, unknown>) => void): void {
    this.errorCallbacks.push(callback);
  }

  handleError(error: Error, context?: Record<string, unknown>): void {
    const errorContext = {
      ...context,
      stack: import.meta.env.DEV ? error.stack : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    if (error instanceof AppError) {
      logger.error(error.message, error, {
        code: error.code,
        statusCode: error.statusCode,
        ...error.context,
      });
    } else {
      logger.error(error.message, error, errorContext);
    }

    this.errorCallbacks.forEach(callback => {
      try {
        callback(error, errorContext);
      } catch (callbackError) {
        logger.error('Error in error callback', callbackError as Error);
      }
    });
  }

  validationError(message: string, context?: Record<string, unknown>): AppError {
    return new AppError(ErrorCode.VALIDATION_ERROR, message, 400, context);
  }

  notFound(resource: string, id?: string): AppError {
    return new AppError(
      ErrorCode.NOT_FOUND,
      `${resource} não encontrado${id ? `: ${id}` : ''}`,
      404,
      { resource, id }
    );
  }

  unauthorized(message: string = 'Não autorizado'): AppError {
    return new AppError(ErrorCode.UNAUTHORIZED, message, 401);
  }

  forbidden(message: string = 'Acesso proibido'): AppError {
    return new AppError(ErrorCode.FORBIDDEN, message, 403);
  }

  databaseError(originalError: Error, context?: Record<string, unknown>): AppError {
    return new AppError(
      ErrorCode.DATABASE_ERROR,
      'Erro ao acessar banco de dados',
      500,
      { originalError: originalError.message, ...context }
    );
  }

  networkError(originalError?: Error): AppError {
    return new AppError(
      ErrorCode.NETWORK_ERROR,
      'Erro de conexão. Verifique sua internet.',
      500,
      { originalError: originalError?.message }
    );
  }
}

export const errorHandler = new ErrorHandler();

export default errorHandler;
