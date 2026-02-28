/**
 * Testes Unitários do CreatePatientUseCase - Application Layer
 * 
 * Cobertura de testes:
 * - Fluxo principal (sucesso)
 * - Validação inválida (nome vazio, telefone vazio)
 * - Erro de autorização
 * - Conflito de domínio
 * - Erro de infraestrutura
 * 
 * Meta: 80% de cobertura
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreatePatientUseCase } from '@/application/useCases/patient/CreatePatient';
import { IPatientRepository } from '@/domain/repositories/IPatientRepository';
import { Patient } from '@/domain/entities/Patient';
import { LoggerPort } from '@/application/ports/LoggerPort';
import { UseCaseContext, UserRole, Permission } from '@/application/useCases/UseCaseContext';
import { AuthorizationService } from '@/application/useCases/AuthorizationService';

// ============================================================
// MOCKS
// ============================================================

/**
 * Mock do Logger
 */
const createMockLogger = (): LoggerPort => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn().mockReturnThis(),
  setContext: vi.fn(),
  clearContext: vi.fn(),
});

/**
 * Mock do Patient Repository
 */
const createMockPatientRepository = () => ({
  findById: vi.fn(),
  findAll: vi.fn(),
  search: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
});

/**
 * Contexto padrão para testes
 */
const createMockContext = (overrides?: Partial<UseCaseContext>): UseCaseContext => ({
  userId: 'user-123',
  tenantId: 'tenant-123',
  roles: [UserRole.ADMIN],
  permissions: [
    Permission.CREATE_PATIENT,
    Permission.READ_PATIENT,
    Permission.UPDATE_PATIENT,
    Permission.DELETE_PATIENT,
  ],
  correlationId: 'correlation-123',
  metadata: {},
  ...overrides,
});

/**
 * Paciente mock para testes
 */
const createMockPatient = (overrides?: Partial<Patient>): Patient => {
  return new Patient(
    overrides?.id || 'patient-123',
    overrides?.tenantId || 'tenant-123',
    overrides?.name || 'John Doe',
    overrides?.phone || '11999999999',
    overrides?.birthDate,
    overrides?.cpf,
    overrides?.email,
    overrides?.observations,
    overrides?.medicalHistory,
    overrides?.active ?? true,
    overrides?.createdAt || new Date(),
    overrides?.updatedAt || new Date()
  );
};

describe('CreatePatientUseCase', () => {
  let useCase: CreatePatientUseCase;
  let mockLogger: LoggerPort;
  let mockRepository: ReturnType<typeof createMockPatientRepository>;

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockRepository = createMockPatientRepository();
    
    useCase = new CreatePatientUseCase({
      patientRepository: mockRepository as unknown as IPatientRepository,
      logger: mockLogger,
      authorizationService: new AuthorizationService(),
    });
  });

  // ============================================================
  // FLUXO PRINCIPAL (SUCESSO)
  // ============================================================

  describe('Fluxo Principal (Sucesso)', () => {
    it('deve criar um paciente com sucesso quando dados são válidos', async () => {
      // Arrange
      const mockPatient = createMockPatient();
      mockRepository.create.mockResolvedValue(mockPatient);
      
      const input = {
        name: 'John Doe',
        phone: '11999999999',
      };
      
      const context = createMockContext();

      // Act
      const result = await useCase.execute(input, context);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(result.unwrap()).toEqual(mockPatient);
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
    });

    it('deve criar um paciente com todos os campos opcionais', async () => {
      // Arrange
      const mockPatient = createMockPatient({
        birthDate: new Date('1990-01-01'),
        cpf: '12345678901',
        email: 'john@example.com',
        observations: 'Alergia a anestesia',
      });
      mockRepository.create.mockResolvedValue(mockPatient);
      
      const input = {
        name: 'John Doe',
        phone: '11999999999',
        birthDate: '1990-01-01',
        cpf: '12345678901',
        email: 'john@example.com',
        observations: 'Alergia a anestesia',
      };
      
      const context = createMockContext();

      // Act
      const result = await useCase.execute(input, context);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
    });

    it('deve remover espaços em branco do nome e telefone', async () => {
      // Arrange
      const mockPatient = createMockPatient({ name: 'John Doe', phone: '11999999999' });
      mockRepository.create.mockResolvedValue(mockPatient);
      
      const input = {
        name: '  John Doe  ',
        phone: '  11999999999  ',
      };
      
      const context = createMockContext();

      // Act
      const result = await useCase.execute(input, context);

      // Assert
      expect(result.isOk()).toBe(true);
      const createdPatient = mockRepository.create.mock.calls[0][0] as Patient;
      expect(createdPatient.name).toBe('John Doe');
      expect(createdPatient.phone).toBe('11999999999');
    });
  });

  // ============================================================
  // VALIDAÇÃO DE AUTORIZAÇÃO
  // ============================================================

  describe('Validação de Autorização', () => {
    it('deve retornar erro quando usuário não tem permissão CREATE_PATIENT', async () => {
      // Arrange
      const input = { name: 'John Doe', phone: '11999999999' };
      const context = createMockContext({
        permissions: [Permission.READ_PATIENT], // Apenas leitura
      });

      // Act
      const result = await useCase.execute(input, context);

      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toContain('Permissão negada');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando usuário não tem nenhuma permissão', async () => {
      // Arrange
      const input = { name: 'John Doe', phone: '11999999999' };
      const context = createMockContext({
        permissions: [],
      });

      // Act
      const result = await useCase.execute(input, context);

      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toContain('Permissão negada');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // VALIDAÇÃO DE ENTRADA
  // ============================================================

  describe('Validação de Entrada', () => {
    it('deve retornar erro quando nome está vazio', async () => {
      // Arrange
      const input = { name: '', phone: '11999999999' };
      const context = createMockContext();

      // Act
      const result = await useCase.execute(input, context);

      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toBe('Nome é obrigatório');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando nome contém apenas espaços', async () => {
      // Arrange
      const input = { name: '   ', phone: '11999999999' };
      const context = createMockContext();

      // Act
      const result = await useCase.execute(input, context);

      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toBe('Nome é obrigatório');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando telefone está vazio', async () => {
      // Arrange
      const input = { name: 'John Doe', phone: '' };
      const context = createMockContext();

      // Act
      const result = await useCase.execute(input, context);

      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toBe('Telefone é obrigatório');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando telefone contém apenas espaços', async () => {
      // Arrange
      const input = { name: 'John Doe', phone: '   ' };
      const context = createMockContext();

      // Act
      const result = await useCase.execute(input, context);

      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toBe('Telefone é obrigatório');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando tenantId está vazio no contexto', async () => {
      // Arrange
      const input = { name: 'John Doe', phone: '11999999999' };
      const context = createMockContext({ tenantId: '' });

      // Act
      const result = await useCase.execute(input, context);

      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toBe('Tenant ID é obrigatório');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // VALIDAÇÃO DE DOMÍNIO
  // ============================================================

  describe('Validação de Domínio', () => {
    it('deve retornar erro quando CPF é inválido', async () => {
      // Arrange
      const input = { 
        name: 'John Doe', 
        phone: '11999999999',
        cpf: '123', // CPF inválido
      };
      const context = createMockContext();

      // Act
      const result = await useCase.execute(input, context);

      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toBe('CPF inválido');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('deve retornar erro quando email é inválido', async () => {
      // Arrange
      const input = { 
        name: 'John Doe', 
        phone: '11999999999',
        email: 'invalid-email', // Email inválido
      };
      const context = createMockContext();

      // Act
      const result = await useCase.execute(input, context);

      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toBe('Email inválido');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // ERRO DE INFRAESTRUTURA
  // ============================================================

  describe('Erro de Infraestrutura', () => {
    it('deve retornar erro quando repository lança exceção', async () => {
      // Arrange
      mockRepository.create.mockRejectedValue(new Error('Database connection failed'));
      
      const input = { name: 'John Doe', phone: '11999999999' };
      const context = createMockContext();

      // Act
      const result = await useCase.execute(input, context);

      // Assert
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toContain('Falha ao criar paciente');
    });

    it('deve retornar erro quando repository retorna erro desconhecido', async () => {
      // Arrange
      mockRepository.create.mockRejectedValue('Unknown error');
      
      const input = { name: 'John Doe', phone: '11999999999' };
      const context = createMockContext();

      // Act
      const result = await useCase.execute(input, context);

      // Assert
      expect(result.isErr()).toBe(true);
    });
  });

  // ============================================================
  // OBSERVABILIDADE
  // ============================================================

  describe('Observabilidade', () => {
    it('deve gerar correlationId no log', async () => {
      // Arrange
      const customCorrelationId = 'custom-correlation-id';
      const mockPatient = createMockPatient();
      mockRepository.create.mockResolvedValue(mockPatient);
      
      const input = { name: 'John Doe', phone: '11999999999' };
      const context = createMockContext({ correlationId: customCorrelationId });

      // Act
      await useCase.execute(input, context);

      // Assert
      const loggerChild = mockLogger.child as ReturnType<typeof vi.fn>;
      expect(loggerChild).toHaveBeenCalledWith(
        expect.objectContaining({
          correlationId: customCorrelationId,
        })
      );
    });

    it('deve logar tempo de execução', async () => {
      // Arrange
      const mockPatient = createMockPatient();
      mockRepository.create.mockResolvedValue(mockPatient);
      
      const input = { name: 'John Doe', phone: '11999999999' };
      const context = createMockContext();

      // Act
      await useCase.execute(input, context);

      // Assert
      const loggerInfo = mockLogger.info as ReturnType<typeof vi.fn>;
      expect(loggerInfo).toHaveBeenCalledWith(
        expect.stringContaining('sucesso'),
        expect.objectContaining({
          durationMs: expect.any(Number),
        })
      );
    });
  });
});
