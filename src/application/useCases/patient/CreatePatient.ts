import { Patient, CreatePatientInput } from '@/domain/entities/Patient';
import { IPatientRepository } from '@/domain/repositories/IPatientRepository';
import { Result, ok, err } from '@/shared/core/Result';
import { AppError, ValidationError, AuthorizationError, UseCaseError } from '@/shared/errors';
import { LoggerPort } from '@/application/ports/LoggerPort';
import { UseCaseContext, Permission } from '@/application/useCases/UseCaseContext';
import { AuthorizationService } from '@/application/useCases/AuthorizationService';

export type CreatePatientInputDTO = CreatePatientInput;

export interface CreatePatientOutputDTO {
  patient: Patient;
}

export interface CreatePatientDeps {
  patientRepository: IPatientRepository;
  logger: LoggerPort;
  authorizationService?: AuthorizationService;
}

export class CreatePatientUseCase {
  private readonly logger: LoggerPort;
  private readonly authorizationService: AuthorizationService;
  private readonly patientRepository: IPatientRepository;

  constructor(deps: CreatePatientDeps) {
    this.patientRepository = deps.patientRepository;
    this.logger = deps.logger;
    this.authorizationService = deps.authorizationService || new AuthorizationService();
  }

  async execute(input: CreatePatientInputDTO, context: UseCaseContext): Promise<Result<Patient, AppError>> {
    const correlationId = context.correlationId;
    const useCaseName = 'CreatePatient';

    const logger = this.logger.child({
      useCase: useCaseName,
      tenantId: context.tenantId,
      userId: context.userId,
      correlationId,
    });

    const startTime = Date.now();
    logger.info(`[${useCaseName}] Iniciando criação de paciente`, {
      input: this.sanitizeInput(input),
    });

    try {
      const authResult = this.authorizationService.can(context, Permission.CREATE_PATIENT);
      if (authResult.isErr()) {
        logger.warn(`[${useCaseName}] Acesso negado`, {
          requiredPermission: Permission.CREATE_PATIENT,
          userId: context.userId,
        });
        return err(authResult.unwrapErr());
      }

      if (!input.name?.trim()) {
        const error = new ValidationError('Nome é obrigatório', { field: 'name', code: 'NAME_REQUIRED' });
        logger.warn(`[${useCaseName}] Validação falhou: nome obrigatório`);
        return err(error);
      }

      if (!input.phone?.trim()) {
        const error = new ValidationError('Telefone é obrigatório', { field: 'phone', code: 'PHONE_REQUIRED' });
        logger.warn(`[${useCaseName}] Validação falhou: telefone obrigatório`);
        return err(error);
      }

      if (!context.tenantId?.trim()) {
        const error = new ValidationError('Tenant ID é obrigatório', { field: 'tenantId', code: 'TENANT_ID_REQUIRED' });
        logger.warn(`[${useCaseName}] Validação falhou: tenantId obrigatório`);
        return err(error);
      }

      // Validar birthDate antes de criar o paciente
      let birthDate: Date | undefined;
      if (input.birthDate && input.birthDate.trim()) {
        const parsedDate = new Date(input.birthDate);
        if (!isNaN(parsedDate.getTime())) {
          birthDate = parsedDate;
        }
      }

      const patientResult = Patient.create({
        tenantId: context.tenantId,
        name: input.name.trim(),
        phone: input.phone.trim(),
        birthDate,
        cpf: input.cpf,
        email: input.email,
        observations: input.observations,
        medicalHistory: input.medicalHistory,
      });

      if (patientResult.isErr()) {
        logger.warn(`[${useCaseName}] Erro de validação de domínio`, {
          error: patientResult.unwrapErr().message,
        });
        return err(patientResult.unwrapErr() as AppError);
      }

      const patient = patientResult.unwrap();

      const createdPatient = await this.patientRepository.create(patient);

      console.log('[CreatePatient] Paciente criado com sucesso:', {
        patientId: createdPatient.id,
        tenantId: createdPatient.tenantId,
        nome: createdPatient.name,
      });

      const duration = Date.now() - startTime;
      logger.info(`[${useCaseName}] Paciente criado com sucesso`, {
        patientId: createdPatient.id,
        tenantId: createdPatient.tenantId,
        durationMs: duration,
      });

      return ok(createdPatient);

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      logger.error(`[${useCaseName}] Erro inesperado ao criar paciente`, 
        error instanceof Error ? error : new Error(String(error)), 
        { durationMs: duration }
      );

      return err(new UseCaseError(`Falha ao criar paciente: ${errorMessage}`, 
        error instanceof Error ? error : undefined));
    }
  }

  private sanitizeInput(input: CreatePatientInputDTO): Record<string, unknown> {
    const sensitiveFields = ['password', 'token', 'secret', 'cpf'];
    const sanitized = { ...input } as Record<string, unknown>;

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
