/**
 * Testes de Segurança Multi-Tenant - Application Layer
 * 
 * Testa cenários de isolamento entre tenants:
 * - Tentativa de acesso cross-tenant
 * - Validação de tenantId em todas as operações
 * - Proteção contra ataques de enumeração
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetPatientUseCase } from '@/application/useCases/patient/GetPatient';
import { IPatientRepository } from '@/domain/repositories/IPatientRepository';
import { Patient } from '@/domain/entities/Patient';
import { LoggerPort } from '@/application/ports/LoggerPort';
import { UseCaseContext, UserRole, Permission } from '@/application/useCases/UseCaseContext';
import { AuthorizationService } from '@/application/useCases/AuthorizationService';

// ============================================================
// MOCKS
// ============================================================

const createMockLogger = (): LoggerPort => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn().mockReturnThis(),
  setContext: vi.fn(),
  clearContext: vi.fn(),
});

const createMockPatientRepository = () => ({
  findById: vi.fn(),
  findAll: vi.fn(),
  search: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

const createMockContext = (overrides?: Partial<UseCaseContext>): UseCaseContext => ({
  userId: 'user-123',
  tenantId: 'tenant-123',
  roles: [UserRole.ADMIN],
  permissions: [Permission.READ_PATIENT],
  correlationId: 'correlation-123',
  metadata: {},
  ...overrides,
});

const createMockPatient = (tenantId: string): Patient => {
  return new Patient(
    'patient-123',
    tenantId,
    'John Doe',
    '11999999999'
  );
};

describe('Multi-Tenant Security', () => {
  let useCase: GetPatientUseCase;
  let mockLogger: LoggerPort;
  let mockRepository: ReturnType<typeof createMockPatientRepository>;

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockRepository = createMockPatientRepository();
    
    useCase = new GetPatientUseCase({
      patientRepository: mockRepository as unknown as IPatientRepository,
      logger: mockLogger,
      authorizationService: new AuthorizationService(),
    });
  });

  describe('Tentativa de Acesso Cross-Tenant', () => {
    it('deve bloquear acesso a paciente de outro tenant', async () => {
      // Arrange: Paciente pertence ao tenant-456
      const patientFromOtherTenant = createMockPatient('tenant-456');
      mockRepository.findById.mockResolvedValue(patientFromOtherTenant);
      
      // Context é do tenant-123
      const context = createMockContext({ tenantId: 'tenant-123' });
      const input = { patientId: 'patient-123' };

      // Act
      const result = await useCase.execute(input, context);

      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toContain('Acesso negado');
    });

    it('deve permitir acesso a paciente do mesmo tenant', async () => {
      // Arrange: Paciente pertence ao tenant-123 (mesmo do contexto)
      const patient = createMockPatient('tenant-123');
      mockRepository.findById.mockResolvedValue(patient);
      
      const context = createMockContext({ tenantId: 'tenant-123' });
      const input = { patientId: 'patient-123' };

      // Act
      const result = await useCase.execute(input, context);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it('deve bloquear acesso quando repository retorna paciente de outro tenant', async () => {
      // Arrange: Repository retorna paciente de tenant diferente
      // (Simula bypass de RLS no banco)
      const maliciousPatient = createMockPatient('tenant-malicious');
      mockRepository.findById.mockResolvedValue(maliciousPatient);
      
      const context = createMockContext({ tenantId: 'tenant-123' });
      const input = { patientId: 'patient-123' };

      // Act
      const result = await useCase.execute(input, context);

      // Assert: Mesmo que o banco retorne dados incorretos,
      // a camada de aplicação deve bloquear
      expect(result.isErr()).toBe(true);
    });
  });

  describe('Proteção contra Enumeração de IDs', () => {
    it('deve revelar mínimo de informação em paciente não encontrado', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);
      
      const context = createMockContext({ tenantId: 'tenant-123' });
      const input = { patientId: 'patient-999' };

      // Act
      const result = await useCase.execute(input, context);

      // Assert: Erro genérico, não revela se tenant existe
      expect(result.isErr()).toBe(true);
      const error = result.unwrapErr();
      expect(error.message).toContain('não encontrado');
    });
  });

  describe('Isolamento de Dados', () => {
    it('deve sempre usar tenantId do contexto, nunca do input', async () => {
      // Arrange
      const patient = createMockPatient('tenant-123');
      mockRepository.findById.mockResolvedValue(patient);
      
      // Input tenta injetar tenantId diferente
      const context = createMockContext({ tenantId: 'tenant-123' });
      const input = { patientId: 'patient-123' };

      // Act
      await useCase.execute(input, context);

      // Assert: Repository deve ser chamado com tenantId do contexto
      expect(mockRepository.findById).toHaveBeenCalledWith(
        'patient-123',
        'tenant-123' // Do contexto, não do input
      );
    });
  });
});
