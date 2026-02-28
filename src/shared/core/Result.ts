export interface IResult<T, E> {
  isOk(): this is ResultOk<T>;
  isErr(): this is ResultErr<E>;
  unwrap(): T;
  unwrapErr(): E;
  map<U>(fn: (value: T) => U): Result<U, E>;
  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E>;
}

export class ResultOk<T, E = never> implements IResult<T, E> {
  constructor(private readonly _value: T) {}

  isOk(): this is ResultOk<T> {
    return true;
  }

  isErr(): this is ResultErr<E> {
    return false;
  }

  unwrap(): T {
    return this._value;
  }

  unwrapErr(): never {
    throw new Error('Called unwrapErr on ResultOk');
  }

  map<U>(fn: (value: T) => U): ResultOk<U, E> {
    return new ResultOk(fn(this._value));
  }

  mapErr<F>(): ResultOk<T, E> {
    return this;
  }

  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this._value);
  }

  unwrapOr(): T {
    return this._value;
  }

  unwrapOrElse(): T {
    return this._value;
  }
}

export class ResultErr<T = never, E = Error> implements IResult<T, E> {
  constructor(private readonly _error: E) {}

  isOk(): this is ResultOk<T> {
    return false;
  }

  isErr(): this is ResultErr<E> {
    return true;
  }

  unwrap(): never {
    throw new Error(`Called unwrap on ResultErr: ${this._error}`);
  }

  unwrapErr(): E {
    return this._error;
  }

  map<U>(): ResultErr<U, E> {
    return new ResultErr(this._error);
  }

  mapErr<F>(fn: (error: E) => F): ResultErr<T, F> {
    return new ResultErr(fn(this._error));
  }

  andThen<U>(): ResultErr<U, E> {
    return new ResultErr(this._error);
  }

  unwrapOr(defaultValue: T): T {
    return defaultValue;
  }

  unwrapOrElse(fn: (error: E) => T): T {
    return fn(this._error);
  }
}

export type Result<T, E = Error> = ResultOk<T, E> | ResultErr<T, E>;

export function ok<T, E = never>(value: T): ResultOk<T, E> {
  return new ResultOk(value);
}

export function err<T = never, E = Error>(error: E): ResultErr<T, E> {
  return new ResultErr(error);
}

export function isOk<T, E>(result: Result<T, E>): result is ResultOk<T, E> {
  return result.isOk();
}

export function isErr<T, E>(result: Result<T, E>): result is ResultErr<T, E> {
  return result.isErr();
}

export async function toResult<T, E>(
  promise: Promise<T>,
  mapError: (error: unknown) => E
): Promise<Result<T, E>> {
  try {
    const value = await promise;
    return ok(value);
  } catch (error) {
    return err(mapError(error));
  }
}

export function combineResults<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const errors: E[] = [];
  const values: T[] = [];

  for (const result of results) {
    if (result.isErr()) {
      errors.push(result.unwrapErr());
    } else {
      values.push(result.unwrap());
    }
  }

  if (errors.length > 0) {
    return err(errors[0] as E);
  }

  return ok(values);
}

export async function all<T, E>(
  promises: Array<Promise<Result<T, E>>>
): Promise<Result<T[], E>> {
  const results = await Promise.all(promises);
  return combineResults(results);
}
