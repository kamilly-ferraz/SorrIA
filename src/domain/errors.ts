// Códigos de erro do sistema
export enum ErrorCode {
  // Autenticação
  UNAUTHORIZED = 'AUTH_001',
  FORBIDDEN = 'AUTH_002',
  
  // Recurso não encontrado
  PATIENT_NOT_FOUND = 'PAT_001',
  APPOINTMENT_NOT_FOUND = 'APT_001',
  OFFICE_NOT_FOUND = 'OFF_001',
  PROCEDURE_TYPE_NOT_FOUND = 'PRC_001',
  
  // Validação
  VALIDATION_ERROR = 'VAL_001',
  REQUIRED_FIELD = 'VAL_002',
  INVALID_FORMAT = 'VAL_003',
  
  // Regras de negócio
  CONFLICT = 'BIZ_001',
  DATE_IN_PAST = 'BIZ_002',
  LGPD_CONSENT_REQUIRED = 'BIZ_003',
  
  // Operações
  CREATE_FAILED = 'OP_001',
  UPDATE_FAILED = 'OP_002',
  DELETE_FAILED = 'OP_003',
}

// Classe de erro da aplicação
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Erros pré-definidos
export const Errors = {
  patientNotFound: () => new AppError(ErrorCode.PATIENT_NOT_FOUND, 'Paciente não encontrado'),
  appointmentNotFound: () => new AppError(ErrorCode.APPOINTMENT_NOT_FOUND, 'Consulta não encontrada'),
  officeNotFound: () => new AppError(ErrorCode.OFFICE_NOT_FOUND, 'Consultório não encontrado'),
  procedureTypeNotFound: () => new AppError(ErrorCode.PROCEDURE_TYPE_NOT_FOUND, 'Tipo de procedimento não encontrado'),
  
  conflict: (message: string) => new AppError(ErrorCode.CONFLICT, message),
  dateInPast: () => new AppError(ErrorCode.DATE_IN_PAST, 'Não é permitido agendar em datas passadas'),
  lgpdConsentRequired: () => new AppError(ErrorCode.LGPD_CONSENT_REQUIRED, 'Consentimento LGPD é obrigatório'),
  
  unauthorized: () => new AppError(ErrorCode.UNAUTHORIZED, 'Não autorizado'),
  forbidden: () => new AppError(ErrorCode.FORBIDDEN, 'Acesso proibido'),
  
  requiredField: (field: string) => new AppError(ErrorCode.REQUIRED_FIELD, `Campo obrigatório: ${field}`),
  invalidFormat: (field: string) => new AppError(ErrorCode.INVALID_FORMAT, `Formato inválido: ${field}`),
  
  createFailed: (entity: string) => new AppError(ErrorCode.CREATE_FAILED, `Falha ao criar ${entity}`),
  updateFailed: (entity: string) => new AppError(ErrorCode.UPDATE_FAILED, `Falha ao atualizar ${entity}`),
  deleteFailed: (entity: string) => new AppError(ErrorCode.DELETE_FAILED, `Falha ao excluir ${entity}`),
};
