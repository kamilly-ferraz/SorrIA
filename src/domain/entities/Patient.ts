import { Result, ok, err } from '@/shared/core/Result';
import { ValidationError } from '@/shared/errors/DomainError';

export class Patient {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public name: string,
    public phone: string,
    public birthDate?: Date,
    public cpf?: string,
    public email?: string,
    public observations?: string,
    public medicalHistory?: string,
    public active: boolean = true,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  static create(data: {
    tenantId: string;
    name: string;
    phone: string;
    birthDate?: Date;
    cpf?: string;
    email?: string;
    observations?: string;
    medicalHistory?: string;
  }): Result<Patient, ValidationError> {
    if (!data.name?.trim()) {
      return err(new ValidationError('Nome é obrigatório'));
    }

    if (!data.phone?.trim()) {
      return err(new ValidationError('Telefone é obrigatório'));
    }

    if (!data.tenantId?.trim()) {
      return err(new ValidationError('Tenant ID é obrigatório'));
    }

    if (data.cpf) {
      const cpfClean = data.cpf.replace(/\D/g, '');
      if (cpfClean.length > 0 && cpfClean.length !== 11) {
        return err(new ValidationError('CPF inválido'));
      }
    }

    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return err(new ValidationError('Email inválido'));
      }
    }

    const patient = new Patient(
      '',
      data.tenantId,
      data.name.trim(),
      data.phone.trim(),
      data.birthDate,
      data.cpf,
      data.email,
      data.observations,
      data.medicalHistory
    );

    return ok(patient);
  }

  isActive(): boolean {
    return this.active;
  }

  activate(): void {
    this.active = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.active = false;
    this.updatedAt = new Date();
  }

  getAge(): number | null {
    if (!this.birthDate) return null;
    
    const today = new Date();
    let age = today.getFullYear() - this.birthDate.getFullYear();
    const monthDiff = today.getMonth() - this.birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  getDisplayName(): string {
    return this.name;
  }

  getInitials(): string {
    const names = this.name.trim().split(' ');
    if (names.length === 1) {
      return names[0]?.charAt(0)?.toUpperCase() || '';
    }
    const first = names[0]?.charAt(0)?.toUpperCase() || '';
    const last = names[names.length - 1]?.charAt(0)?.toUpperCase() || '';
    return first + last;
  }

  isValid(): boolean {
    return !!this.name?.trim() && !!this.phone?.trim();
  }
}

export interface CreatePatientInput {
  name: string;
  phone: string;
  birthDate?: string;
  cpf?: string;
  email?: string;
  observations?: string;
  medicalHistory?: string;
}

export interface UpdatePatientInput {
  name?: string;
  phone?: string;
  birthDate?: string;
  cpf?: string;
  email?: string;
  observations?: string;
  medicalHistory?: string;
}

export interface PatientFilter {
  tenantId: string;
  activeOnly?: boolean;
  searchTerm?: string;
}
