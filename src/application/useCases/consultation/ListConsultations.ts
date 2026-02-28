import { Consultation, ConsultationFilter } from '@/domain/entities/Consultation';
import { IConsultationRepository } from '@/domain/repositories/IConsultationRepository';
import { Result, ok, err } from '@/shared/core/Result';
import { AppError, ValidationError, UseCaseError } from '@/shared/errors';
import { LoggerPort } from '@/application/ports/LoggerPort';
import { UseCaseContext } from '@/application/useCases/UseCaseContext';
import { 
  PaginationParams, 
  PaginatedResult,
  createPaginationParams 
} from '@/shared/types/Pagination';

export interface ListConsultationsInputDTO {
  filter: ConsultationFilter;
  pagination: PaginationParams;
}

export type ListConsultationsOutputDTO = PaginatedResult<Consultation>;

export interface ListConsultationsDeps {
  consultationRepository: IConsultationRepository;
  logger: LoggerPort;
}

export class ListConsultationsUseCase {
  constructor(
    private readonly consultationRepository: IConsultationRepository,
    private readonly logger: LoggerPort
  ) {}

  async execute(
    input: ListConsultationsInputDTO, 
    context: UseCaseContext
  ): Promise<Result<ListConsultationsOutputDTO, AppError>> {
    const correlationId = context.correlationId;
    const useCaseName = 'ListConsultations';

    const logger = this.logger.child({
      useCase: useCaseName,
      tenantId: context.tenantId,
      userId: context.userId,
      correlationId,
    });

    const startTime = Date.now();
    logger.info(`[${useCaseName}] Listando consultas com paginação`, { input });

    try {
      if (!context.tenantId?.trim()) {
        const error = new ValidationError('Tenant ID é obrigatório', { field: 'tenantId', code: 'TENANT_ID_REQUIRED' });
        logger.warn(`[${useCaseName}] Validação falhou: tenantId obrigatório`);
        return err(error);
      }

      const pagination = createPaginationParams(input.pagination?.page, input.pagination?.pageSize);
      
      const filter: ConsultationFilter = {
        ...input.filter,
        tenantId: context.tenantId,
      };

      const paginatedResult = await this.consultationRepository.findAllPaginated(filter, pagination);

      const duration = Date.now() - startTime;
      logger.info(`[${useCaseName}] Consultas listadas com sucesso`, { 
        count: paginatedResult.data.length,
        total: paginatedResult.total,
        page: paginatedResult.page,
        pageSize: paginatedResult.pageSize,
        durationMs: duration 
      });

      return ok(paginatedResult as ListConsultationsOutputDTO);

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`[${useCaseName}] Erro ao listar consultas`,
        error instanceof Error ? error : new Error(String(error)),
        { durationMs: duration }
      );
      return err(new UseCaseError('Falha ao listar consultas',
        error instanceof Error ? error : undefined));
    }
  }

  async executeByPatient(
    patientId: string, 
    tenantId: string, 
    pagination: PaginationParams,
    context: UseCaseContext
  ): Promise<Result<ListConsultationsOutputDTO, AppError>> {
    const correlationId = context.correlationId;
    const useCaseName = 'ListConsultationsByPatient';

    const logger = this.logger.child({
      useCase: useCaseName,
      tenantId,
      patientId,
      correlationId,
    });

    const startTime = Date.now();

    try {
      if (!patientId?.trim()) {
        const error = new ValidationError('ID do paciente é obrigatório', { field: 'patientId', code: 'PATIENT_ID_REQUIRED' });
        return err(error);
      }

      if (!tenantId?.trim()) {
        const error = new ValidationError('Tenant ID é obrigatório', { field: 'tenantId', code: 'TENANT_ID_REQUIRED' });
        return err(error);
      }

      const paginatedParams = createPaginationParams(pagination?.page, pagination?.pageSize);
      
      const paginatedResult = await this.consultationRepository.findByPatientPaginated(
        patientId, 
        tenantId, 
        paginatedParams
      );

      const duration = Date.now() - startTime;
      logger.info(`[${useCaseName}] Consultas do paciente listadas com sucesso`, { 
        count: paginatedResult.data.length,
        total: paginatedResult.total,
        durationMs: duration 
      });

      return ok(paginatedResult as ListConsultationsOutputDTO);

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`[${useCaseName}] Erro ao listar consultas do paciente`,
        error instanceof Error ? error : new Error(String(error)),
        { durationMs: duration }
      );
      return err(new UseCaseError('Falha ao listar consultas do paciente',
        error instanceof Error ? error : undefined));
    }
  }
}
