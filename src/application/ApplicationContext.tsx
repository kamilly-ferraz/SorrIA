import { createContext, useContext, ReactNode } from 'react';

import { IPatientRepository } from '@/domain/repositories/IPatientRepository';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { IConsultationRepository } from '@/domain/repositories/IConsultationRepository';

import { SupabasePatientRepository } from '@/infrastructure/repositories/SupabasePatientRepository';
import { SupabaseAppointmentRepository } from '@/infrastructure/repositories/SupabaseAppointmentRepository';
import { SupabaseConsultationRepository } from '@/infrastructure/repositories/SupabaseConsultationRepository';

import { CreatePatientUseCase } from '@/application/useCases/patient/CreatePatient';
import { ListPatientsUseCase } from '@/application/useCases/patient/ListPatients';
import { UpdatePatientUseCase } from '@/application/useCases/patient/UpdatePatient';
import { GetPatientUseCase } from '@/application/useCases/patient/GetPatient';
import { ScheduleAppointmentUseCase } from '@/application/useCases/appointment/ScheduleAppointment';
import { ListAppointmentsUseCase } from '@/application/useCases/appointment/ListAppointments';
import { CancelAppointmentUseCase } from '@/application/useCases/appointment/CancelAppointment';
import { CompleteConsultationUseCase } from '@/application/useCases/appointment/CompleteConsultation';
import { CreateConsultationUseCase } from '@/application/useCases/consultation/CreateConsultation';
import { ListConsultationsUseCase } from '@/application/useCases/consultation/ListConsultations';

import { logger } from '@/lib/Logger';
type LoggerType = typeof logger;

export interface ApplicationServices {
  patientRepository: IPatientRepository;
  appointmentRepository: IAppointmentRepository;
  consultationRepository: IConsultationRepository;
  
  createPatientUseCase: CreatePatientUseCase;
  listPatientsUseCase: ListPatientsUseCase;
  updatePatientUseCase: UpdatePatientUseCase;
  getPatientUseCase: GetPatientUseCase;
  
  scheduleAppointmentUseCase: ScheduleAppointmentUseCase;
  listAppointmentsUseCase: ListAppointmentsUseCase;
  cancelAppointmentUseCase: CancelAppointmentUseCase;
  completeConsultationUseCase: CompleteConsultationUseCase;
  
  createConsultationUseCase: CreateConsultationUseCase;
  listConsultationsUseCase: ListConsultationsUseCase;
  
  logger: LoggerType;
}

const ApplicationContext = createContext<ApplicationServices | null>(null);

function createApplicationServices(): ApplicationServices {
  const patientRepository: IPatientRepository = new SupabasePatientRepository();
  const appointmentRepository: IAppointmentRepository = new SupabaseAppointmentRepository();
  const consultationRepository: IConsultationRepository = new SupabaseConsultationRepository();
  
  const createPatientUseCase = new CreatePatientUseCase({
    patientRepository,
    logger,
  });
  
  const listPatientsUseCase = new ListPatientsUseCase({
    patientRepository,
    logger,
  });
  
  const updatePatientUseCase = new UpdatePatientUseCase({
    patientRepository,
    logger,
  });
  
  const getPatientUseCase = new GetPatientUseCase({
    patientRepository,
    logger,
  });
  
  const scheduleAppointmentUseCase = new ScheduleAppointmentUseCase(appointmentRepository);
  
  const listAppointmentsUseCase = new ListAppointmentsUseCase(
    appointmentRepository,
    patientRepository,
    logger
  );
  
  const cancelAppointmentUseCase = new CancelAppointmentUseCase(appointmentRepository);
  const completeConsultationUseCase = new CompleteConsultationUseCase(appointmentRepository);
  
  const createConsultationUseCase = new CreateConsultationUseCase(consultationRepository);
  const listConsultationsUseCase = new ListConsultationsUseCase(consultationRepository, logger);
  
  return {
    patientRepository,
    appointmentRepository,
    consultationRepository,
    
    createPatientUseCase,
    listPatientsUseCase,
    updatePatientUseCase,
    getPatientUseCase,
    
    scheduleAppointmentUseCase,
    listAppointmentsUseCase,
    cancelAppointmentUseCase,
    completeConsultationUseCase,
    
    createConsultationUseCase,
    listConsultationsUseCase,
    
    logger,
  };
}

const applicationServices = createApplicationServices();

interface ApplicationProviderProps {
  children: ReactNode;
}

export function ApplicationProvider({ children }: ApplicationProviderProps) {
  return (
    <ApplicationContext.Provider value={applicationServices}>
      {children}
    </ApplicationContext.Provider>
  );
}

export function useApplication(): ApplicationServices {
  const context = useContext(ApplicationContext);
  
  if (!context) {
    throw new Error(
      'useApplication must be used within an ApplicationProvider. ' +
      'Ensure your App is wrapped with ApplicationProvider.'
    );
  }
  
  return context;
}

export function usePatientUseCases() {
  const { 
    createPatientUseCase, 
    listPatientsUseCase, 
    updatePatientUseCase, 
    getPatientUseCase 
  } = useApplication();
  return { 
    createPatientUseCase, 
    listPatientsUseCase, 
    updatePatientUseCase, 
    getPatientUseCase 
  };
}

export function useAppointmentUseCases() {
  const { 
    scheduleAppointmentUseCase, 
    listAppointmentsUseCase, 
    cancelAppointmentUseCase,
    completeConsultationUseCase 
  } = useApplication();
  
  return { 
    scheduleAppointmentUseCase, 
    listAppointmentsUseCase, 
    cancelAppointmentUseCase,
    completeConsultationUseCase 
  };
}

export function useConsultationUseCases() {
  const { 
    createConsultationUseCase, 
    listConsultationsUseCase 
  } = useApplication();
  
  return { 
    createConsultationUseCase, 
    listConsultationsUseCase 
  };
}

export function useLogger() {
  const { logger } = useApplication();
  return logger;
}

export default ApplicationContext;
