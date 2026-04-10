// Validações reutilizáveis
export class Validation {
  static isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    return false;
  }

  static isValidDate(date: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) return false;
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }

  static isPastDate(date: string): boolean {
    const inputDate = new Date(date + 'T23:59:59');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate < today;
  }

  static isValidCPF(cpf: string): boolean {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return false;
    return true;
  }

  static isPositiveNumber(value: number): boolean {
    return typeof value === 'number' && value > 0;
  }

  static isNonNegativeNumber(value: number): boolean {
    return typeof value === 'number' && value >= 0;
  }

  static minLength(value: string, min: number): boolean {
    return value.length >= min;
  }

  static maxLength(value: string, max: number): boolean {
    return value.length <= max;
  }
}
