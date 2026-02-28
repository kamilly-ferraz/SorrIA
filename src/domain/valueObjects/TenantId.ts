import { Result, ok, err } from '@/shared/core/Result';
import { ValidationError } from '@/shared/errors/DomainError';

export class TenantId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): Result<TenantId, ValidationError> {
    if (!value?.trim()) {
      return err(new ValidationError('Tenant ID é obrigatório', { field: 'tenantId' }));
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      return err(new ValidationError('Tenant ID deve ser um UUID válido', { field: 'tenantId' }));
    }

    return ok(new TenantId(value.toLowerCase()));
  }

  static fromRaw(value: string): TenantId {
    return new TenantId(value.toLowerCase());
  }

  get value(): string {
    return this._value;
  }

  equals(other: TenantId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
