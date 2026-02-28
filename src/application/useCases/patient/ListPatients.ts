import { Patient, PatientFilter } from '@/domain/entities/Patient';
import { IPatientRepository } from '@/domain/repositories/IPatientRepository';
import { Result, ok, err } from '@/shared/core/Result';
import { AppError, ValidationError, UseCaseError } from '@/shared/errors';
import { LoggerPort } from '@/application/ports/LoggerPort';
import { UseCaseContext, Permission } from '@/application/useCases/UseCaseContext';
import { AuthorizationService } from '@/application/useCases/AuthorizationService';
import { 
  PaginationParams, 
  PaginatedResult,
  createPaginationParams 
} from '@/shared/types/Pagination';

export interface ListPatientsInputDTO {
  activeOnly?: boolean;
  searchTerm?: string;
  pagination: PaginationParams;
}

export type ListPatientsOutputDTO = PaginatedResult<Patient>;

export interface ListPatientsDeps {
  patientRepository: IPatientRepository;
  logger: LoggerPort;
  authorizationService?: AuthorizationService;
}

export class ListPatientsUseCase {
  private readonly logger: LoggerPort;
  private readonly authorizationService: AuthorizationService;
  private readonly patientRepository: IPatientRepository;

  constructor(deps: ListPatientsDeps) {
    this.patientRepository = deps.patientRepository;
    this.logger = deps.logger;
    this.authorizationService = deps.authorizationService || new AuthorizationService();
  }

  async execute(
    input: ListPatientsInputDTO, 
    context: UseCaseContext
  ): Promise<Result<ListPatientsOutputDTO, AppError>> {
    const correlationId = context.correlationId;
    const useCaseName = 'ListPatients';

    const logger = this.logger.child({
      useCase: useCaseName,
      tenantId: context.tenantId,
      userId: context.userId,
      correlationId,
    });

    const startTime = Date.now();
    logger.info(`[${useCaseName}] Listando pacientes com paginação`, { input });

    try {
      const authResult = this.authorizationService.can(context, Permission.READ_PATIENT);
      if (authResult.isErr()) {
        logger.warn(`[${useCaseName}] Acesso negado`, { requiredPermission: Permission.READ_PATIENT });
        return err(authResult.unwrapErr());
      }

      if (!context.tenantId?.trim()) {
        const error = new ValidationError('Tenant ID é obrigatório', { field: 'tenantId', code: 'TENANT_ID_REQUIRED' });
        logger.warn(`[${useCaseName}] Validação falhou: tenantId obrigatório`);
        return err(error);
      }

      const pagination = createPaginationParams(input.pagination?.page, input.pagination?.pageSize);
      
      const filter: PatientFilter = {
        tenantId: context.tenantId,
        activeOnly: input.activeOnly ?? true,
        searchTerm: input.searchTerm?.trim(),
      };

      const paginatedResult = await this.patientRepository.findAllPaginated(filter, pagination);

      const duration = Date.now() - startTime;
      logger.info(`[${useCaseName}] Pacientes listados com sucesso`, { 
        count: paginatedResult.data.length,
        total: paginatedResult.total,
        page: paginatedResult.page,
        pageSize: paginatedResult.pageSize,
        durationMs: duration 
      });

      return ok(paginatedResult);

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`[${useCaseName}] Erro ao listar pacientes`,
        error instanceof Error ? error : new Error(String(error)),
        { durationMs: duration }
      );
      return err(new UseCaseError('Falha ao listar pacientes',
        error instanceof Error ? error : undefined));
    }
  }
}
