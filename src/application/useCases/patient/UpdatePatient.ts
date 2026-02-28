import { Patient, UpdatePatientInput } from '@/domain/entities/Patient';
import { IPatientRepository } from '@/domain/repositories/IPatientRepository';
import { Result, ok, err } from '@/shared/core/Result';
import { AppError, ValidationError, EntityNotFoundError, UseCaseError } from '@/shared/errors';
import { LoggerPort } from '@/application/ports/LoggerPort';
import { UseCaseContext, Permission } from '@/application/useCases/UseCaseContext';
import { AuthorizationService } from '@/application/useCases/AuthorizationService';

export interface UpdatePatientInputDTO extends UpdatePatientInput {
  patientId: string;
}

export interface UpdatePatientDeps {
  patientRepository: IPatientRepository;
  logger: LoggerPort;
  authorizationService?: AuthorizationService;
}

export class UpdatePatientUseCase {
  private readonly logger: LoggerPort;
  private readonly authorizationService: AuthorizationService;
  private readonly patientRepository: IPatientRepository;

  constructor(deps: UpdatePatientDeps) {
    this.patientRepository = deps.patientRepository;
    this.logger = deps.logger;
    this.authorizationService = deps.authorizationService || new AuthorizationService();
  }

  async execute(input: UpdatePatientInputDTO, context: UseCaseContext): Promise<Result<Patient, AppError>> {
    const correlationId = context.correlationId;
    const useCaseName = 'UpdatePatient';

    const logger = this.logger.child({
      useCase: useCaseName,
      tenantId: context.tenantId,
      userId: context.userId,
      correlationId,
    });

    const startTime = Date.now();
    logger.info(`[${useCaseName}] Atualizando paciente`, { 
      patientId: input.patientId,
      input: this.sanitizeInput(input) 
    });

    try {
      const authResult = this.authorizationService.can(context, Permission.UPDATE_PATIENT);
      if (authResult.isErr()) {
        logger.warn(`[${useCaseName}] Acesso negado`, { requiredPermission: Permission.UPDATE_PATIENT });
        return err(authResult.unwrapErr());
      }

      if (!input.patientId?.trim()) {
        const error = new ValidationError('ID do paciente é obrigatório', { field: 'patientId', code: 'PATIENT_ID_REQUIRED' });
        logger.warn(`[${useCaseName}] Validação falhou: patientId obrigatório`);
        return err(error);
      }

      if (!context.tenantId?.trim()) {
        const error = new ValidationError('Tenant ID é obrigatório', { field: 'tenantId', code: 'TENANT_ID_REQUIRED' });
        logger.warn(`[${useCaseName}] Validação falhou: tenantId obrigatório`);
        return err(error);
      }

      if (input.name !== undefined && !input.name?.trim()) {
        const error = new ValidationError('Nome não pode ser vazio', { field: 'name', code: 'NAME_EMPTY' });
        logger.warn(`[${useCaseName}] Validação falhou: nome vazio`);
        return err(error);
      }

      if (input.phone !== undefined && !input.phone?.trim()) {
        const error = new ValidationError('Telefone não pode ser vazio', { field: 'phone', code: 'PHONE_EMPTY' });
        logger.warn(`[${useCaseName}] Validação falhou: telefone vazio`);
        return err(error);
      }

      const existingPatient = await this.patientRepository.findById(input.patientId, context.tenantId);
      if (!existingPatient) {
        const error = new EntityNotFoundError('Paciente', input.patientId);
        logger.warn(`[${useCaseName}] Paciente não encontrado`);
        return err(error);
      }

      const tenantAccessResult = this.authorizationService.canAccessTenantResource(context, existingPatient.tenantId);
      if (tenantAccessResult.isErr()) {
        logger.warn(`[${useCaseName}] Acesso cross-tenant detectado`);
        return err(tenantAccessResult.unwrapErr());
      }

      const updateData: Partial<Patient> = {};
      
      if (input.name !== undefined) {
        updateData.name = input.name.trim();
      }
      
      if (input.phone !== undefined) {
        updateData.phone = input.phone.trim();
      }
      
      if (input.birthDate !== undefined) {
        // Validar birthDate antes de converter
        if (input.birthDate && input.birthDate.trim()) {
          const parsedDate = new Date(input.birthDate);
          if (!isNaN(parsedDate.getTime())) {
            updateData.birthDate = parsedDate;
          }
        }
        // Se for string vazia ou inválida, não define (mantém undefined)
      }
      
      if (input.cpf !== undefined) {
        updateData.cpf = input.cpf;
      }
      
      if (input.email !== undefined) {
        updateData.email = input.email;
      }
      
      if (input.observations !== undefined) {
        updateData.observations = input.observations;
      }
      
      if (input.medicalHistory !== undefined) {
        updateData.medicalHistory = input.medicalHistory;
      }

      const updatedPatient = await this.patientRepository.update(input.patientId, updateData);

      const duration = Date.now() - startTime;
      logger.info(`[${useCaseName}] Paciente atualizado com sucesso`, { 
        patientId: updatedPatient.id,
        durationMs: duration 
      });

      return ok(updatedPatient);

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`[${useCaseName}] Erro ao atualizar paciente`,
        error instanceof Error ? error : new Error(String(error)),
        { durationMs: duration }
      );
      return err(new UseCaseError('Falha ao atualizar paciente',
        error instanceof Error ? error : undefined));
    }
  }

  private sanitizeInput(input: UpdatePatientInputDTO): Record<string, unknown> {
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
