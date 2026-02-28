import { Appointment, AppointmentFilter } from '@/domain/entities/Appointment';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { IPatientRepository } from '@/domain/repositories/IPatientRepository';
import { Result, ok, err } from '@/shared/core/Result';
import { AppError, ValidationError, UseCaseError } from '@/shared/errors';
import { LoggerPort } from '@/application/ports/LoggerPort';
import { UseCaseContext } from '@/application/useCases/UseCaseContext';
import { 
  PaginationParams, 
  PaginatedResult,
  createPaginationParams 
} from '@/shared/types/Pagination';

export interface ListAppointmentsInputDTO {
  filter: AppointmentFilter;
  pagination: PaginationParams;
}

export type ListAppointmentsOutputDTO = PaginatedResult<Appointment>;

export interface ListAppointmentsDeps {
  appointmentRepository: IAppointmentRepository;
  patientRepository: IPatientRepository;
  logger: LoggerPort;
}

export class ListAppointmentsUseCase {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly patientRepository: IPatientRepository,
    private readonly logger: LoggerPort
  ) {}

  async execute(
    input: ListAppointmentsInputDTO, 
    context: UseCaseContext
  ): Promise<Result<ListAppointmentsOutputDTO, AppError>> {
    const correlationId = context.correlationId;
    const useCaseName = 'ListAppointments';

    const logger = this.logger.child({
      useCase: useCaseName,
      tenantId: context.tenantId,
      userId: context.userId,
      correlationId,
    });

    const startTime = Date.now();
    logger.info(`[${useCaseName}] Listando agendamentos com paginação`, { input });

    try {
      if (!context.tenantId?.trim()) {
        const error = new ValidationError('Tenant ID é obrigatório', { field: 'tenantId', code: 'TENANT_ID_REQUIRED' });
        logger.warn(`[${useCaseName}] Validação falhou: tenantId obrigatório`);
        return err(error);
      }

      const pagination = createPaginationParams(input.pagination?.page, input.pagination?.pageSize);
      
      const filter: AppointmentFilter = {
        ...input.filter,
        tenantId: context.tenantId,
      };

      const paginatedResult = await this.appointmentRepository.findAllPaginated(filter, pagination);

      const patientIds = [...new Set(
        paginatedResult.data
          .map(a => a.patientId)
          .filter((id): id is string => !!id)
      )];

      const patientMap = new Map<string, string>();
      
      for (const patientId of patientIds) {
        const patient = await this.patientRepository.findById(patientId, context.tenantId);
        if (patient) {
          patientMap.set(patientId, patient.name);
        }
      }

      const enrichedData = paginatedResult.data.map(appointment => {
        const name = appointment.patientId 
          ? patientMap.get(appointment.patientId) || appointment.patientName
          : appointment.patientName;
        return Object.assign({}, appointment, { patientName: name });
      });

      const duration = Date.now() - startTime;
      logger.info(`[${useCaseName}] Agendamentos listados com sucesso`, { 
        count: enrichedData.length,
        total: paginatedResult.total,
        page: paginatedResult.page,
        pageSize: paginatedResult.pageSize,
        durationMs: duration 
      });

      return ok({
        ...paginatedResult,
        data: enrichedData,
      } as ListAppointmentsOutputDTO);

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`[${useCaseName}] Erro ao listar agendamentos`,
        error instanceof Error ? error : new Error(String(error)),
        { durationMs: duration }
      );
      return err(new UseCaseError('Falha ao listar agendamentos',
        error instanceof Error ? error : undefined));
    }
  }
}
