import { Result, ok, err } from '@/shared/core/Result';

export interface Transaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isActive(): boolean;
}

export interface TransactionManager {
  startTransaction(): Promise<Transaction>;
  executeInTransaction<T>(fn: (transaction: Transaction) => Promise<T>): Promise<Result<T, Error>>;
  isAvailable(): boolean;
}

export class NoOpTransaction implements Transaction {
  private _active = true;
  
  async commit(): Promise<void> {
    this._active = false;
  }
  
  async rollback(): Promise<void> {
    this._active = false;
  }
  
  isActive(): boolean {
    return this._active;
  }
}

export class NoOpTransactionManager implements TransactionManager {
  async startTransaction(): Promise<Transaction> {
    return new NoOpTransaction();
  }
  
  async executeInTransaction<T>(fn: (transaction: Transaction) => Promise<T>): Promise<Result<T, Error>> {
    try {
      const result = await fn(new NoOpTransaction());
      return ok(result);
    } catch (error) {
      return err(error as Error);
    }
  }
  
  isAvailable(): boolean {
    return false;
  }
}
