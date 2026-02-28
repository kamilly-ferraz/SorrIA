/**
 * Testes da Entidade Patient - Domain Layer
 */
import { describe, it, expect } from 'vitest';
import { Patient } from '@/domain/entities/Patient';

describe('Patient Entity', () => {
  const tenantId = 'tenant-123';

  it('should create a valid patient', () => {
    const patient = new Patient(
      '123',
      tenantId,
      'John Doe',
      '(11) 99999-9999',
      new Date('1990-01-01')
    );

    expect(patient.isValid()).toBe(true);
    expect(patient.getAge()).toBeGreaterThan(0);
    expect(patient.isActive()).toBe(true);
  });

  it('should deactivate patient', () => {
    const patient = new Patient('123', tenantId, 'John Doe', '(11) 99999-9999');
    
    patient.deactivate();
    
    expect(patient.isActive()).toBe(false);
    expect(patient.active).toBe(false);
  });

  it('should activate patient', () => {
    const patient = new Patient('123', tenantId, 'John Doe', '(11) 99999-9999', undefined, undefined, undefined, undefined, undefined, false);
    
    patient.activate();
    
    expect(patient.isActive()).toBe(true);
    expect(patient.active).toBe(true);
  });

  it('should return invalid when name is empty', () => {
    const patient = new Patient('123', tenantId, '', '(11) 99999-9999');
    
    expect(patient.isValid()).toBe(false);
  });

  it('should return invalid when phone is empty', () => {
    const patient = new Patient('123', tenantId, 'John Doe', '');
    
    expect(patient.isValid()).toBe(false);
  });

  it('should return initials correctly', () => {
    const patient = new Patient('123', tenantId, 'John Doe', '(11) 99999-9999');
    
    expect(patient.getInitials()).toBe('JD');
  });

  it('should return single initial for single name', () => {
    const patient = new Patient('123', tenantId, 'John', '(11) 99999-9999');
    
    expect(patient.getInitials()).toBe('J');
  });

  it('should return age correctly', () => {
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 30);
    
    const patient = new Patient('123', tenantId, 'John Doe', '(11) 99999-9999', birthDate);
    
    expect(patient.getAge()).toBe(30);
  });

  it('should return null age when birthDate is not provided', () => {
    const patient = new Patient('123', tenantId, 'John Doe', '(11) 99999-9999');
    
    expect(patient.getAge()).toBeNull();
  });
});
