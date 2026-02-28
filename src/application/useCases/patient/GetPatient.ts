import { Patient } from '@/domain/entities/Patient';
import { IPatientRepository } from '@/domain/repositories/IPatientRepository';
import { Result, ok, err } from '@/shared/core/Result';
import { AppError, ValidationError, EntityNotFoundError, UseCaseError } from '@/shared/errors';
import { LoggerPort } from '@/application/ports/LoggerPort';
import { UseCaseContext, Permission } from '@/application/useCases/UseCaseContext';
import { AuthorizationService } from '@/application/useCases/AuthorizationService';

export interface GetPatientInputDTO {
  patientId: string;
}

export interface GetPatientDeps {
  patientRepository: IPatientRepository;
  logger: LoggerPort;
  authorizationService?: AuthorizationService;
}

export class GetPatientUseCase {
  private readonly logger: LoggerPort;
  private readonly authorizationService: AuthorizationService;
  private readonly patientRepository: IPatientRepository;

  constructor(deps: GetPatientDeps) {
    this.patientRepository = deps.patientRepository;
    this.logger = deps.logger;
    this.authorizationService = deps.authorizationService || new AuthorizationService();
  }

  async execute(input: GetPatientInputDTO, context: UseCaseContext): Promise<Result<Patient, AppError>> {
    const correlationId = context.correlationId;
    const useCaseName = 'GetPatient';

    const logger = this.logger.child({
      useCase: useCaseName,
      tenantId: context.tenantId,
      userId: context.userId,
      correlationId,
    });

    const startTime = Date.now();
    logger.info(`[${useCaseName}] Buscando paciente`, { patientId: input.patientId });

    try {
      const authResult = this.authorizationService.can(context, Permission.READ_PATIENT);
      if (authResult.isErr()) {
        logger.warn(`[${useCaseName}] Acesso negado`, { requiredPermission: Permission.READ_PATIENT });
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

      const patient = await this.patientRepository.findById(input.patientId, context.tenantId);

      if (!patient) {
        const error = new EntityNotFoundError('Paciente', input.patientId);
        logger.warn(`[${useCaseName}] Paciente não encontrado`);
        return err(error);
      }

      const tenantAccessResult = this.authorizationService.canAccessTenantResource(context, patient.tenantId);
      if (tenantAccessResult.isErr()) {
        logger.warn(`[${useCaseName}] Acesso cross-tenant detectado`, {
          resourceTenantId: patient.tenantId,
          requestTenantId: context.tenantId,
        });
        return err(tenantAccessResult.unwrapErr());
      }

      const duration = Date.now() - startTime;
      logger.info(`[${useCaseName}] Paciente encontrado`, { patientId: patient.id, durationMs: duration });

      return ok(patient);

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`[${useCaseName}] Erro ao buscar paciente`,
        error instanceof Error ? error : new Error(String(error)),
        { durationMs: duration }
      );
      return err(new UseCaseError('Falha ao buscar paciente',
        error instanceof Error ? error : undefined));
    }
  }
}
