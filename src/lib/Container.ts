import { IPatientRepository } from '@/domain/repositories/IPatientRepository';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { IConsultationRepository } from '@/domain/repositories/IConsultationRepository';

type RepositoryFactory<T> = () => T;

interface DIContainer {
  patientRepository: IPatientRepository;
  appointmentRepository: IAppointmentRepository;
  consultationRepository: IConsultationRepository;
}

class Container {
  private repositories: Partial<DIContainer> = {};
  // Using any for factory type - acceptable for DI container
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private factories: Partial<Record<keyof DIContainer, RepositoryFactory<any>>> = {};

  registerSingleton<T extends keyof DIContainer>(
    name: T,
    instance: DIContainer[T]
  ): void {
    this.repositories[name] = instance;
  }

  registerFactory<T extends keyof DIContainer>(
    name: T,
    factory: RepositoryFactory<DIContainer[T]>
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.factories[name] = factory as any;
  }

  resolve<T extends keyof DIContainer>(name: T): DIContainer[T] {
    if (this.factories[name]) {
      return this.factories[name]!();
    }

    if (this.repositories[name]) {
      return this.repositories[name] as DIContainer[T];
    }

    throw new Error(`Dependency not registered: ${name}`);
  }

  has<T extends keyof DIContainer>(name: T): boolean {
    return !!(this.repositories[name] || this.factories[name]);
  }

  clear(): void {
    this.repositories = {};
    this.factories = {};
  }
}

const container = new Container();

export { container };
export default container;
