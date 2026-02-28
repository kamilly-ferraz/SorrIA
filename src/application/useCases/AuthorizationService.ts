import { UseCaseContext, Permission, hasPermission } from './UseCaseContext';
import { Result, ok, err } from '@/shared/core/Result';
import { AuthorizationError } from '@/shared/errors/ApplicationError';

export type AuthorizationResult = Result<void, AuthorizationError>;

export class AuthorizationService {
  can(context: UseCaseContext, permission: Permission): AuthorizationResult {
    if (!hasPermission(context, permission)) {
      return err(new AuthorizationError(
        `Permissão negada: ${permission}. Você não tem acesso a esta ação.`
      ));
    }
    return ok(undefined);
  }

  canAll(context: UseCaseContext, permissions: Permission[]): AuthorizationResult {
    for (const permission of permissions) {
      if (!hasPermission(context, permission)) {
        return err(new AuthorizationError(
          `Permissão negada: ${permission}. Você não tem acesso a esta ação.`
        ));
      }
    }
    return ok(undefined);
  }

  canAny(context: UseCaseContext, permissions: Permission[]): AuthorizationResult {
    for (const permission of permissions) {
      if (hasPermission(context, permission)) {
        return ok(undefined);
      }
    }
    return err(new AuthorizationError(
      `Permissão negada: nenhuma das permissões requeridas está disponível.`
    ));
  }

  canAccessTenantResource(context: UseCaseContext, resourceTenantId: string): AuthorizationResult {
    if (context.tenantId !== resourceTenantId) {
      return err(new AuthorizationError(
        `Acesso negado: você não tem permissão para acessar recursos deste tenant.`
      ));
    }
    return ok(undefined);
  }

  authorize<T, Input, Output>(
    permission: Permission,
    executeUseCase: (input: Input, context: UseCaseContext) => Promise<Result<T, unknown>>
  ) {
    return async (input: Input, context: UseCaseContext): Promise<Result<T, unknown>> => {
      const authResult = this.can(context, permission);
      if (authResult.isErr()) {
        return err(authResult.unwrapErr());
      }

      return executeUseCase(input, context);
    };
  }
}

export const authorizationService = new AuthorizationService();
