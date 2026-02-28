export * from './DomainError';
export * from './ApplicationError';
export * from './InfrastructureError';

export type AppError = 
  | InstanceType<typeof import('./DomainError').DomainError>
  | InstanceType<typeof import('./ApplicationError').ApplicationError>
  | InstanceType<typeof import('./InfrastructureError').InfrastructureError>
  | Error;

export function isAppError(error: unknown): error is AppError {
  return error instanceof Error;
}

export function getErrorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as { code: string }).code;
  }
  if (error instanceof Error) {
    return error.name;
  }
  return 'UNKNOWN_ERROR';
}
