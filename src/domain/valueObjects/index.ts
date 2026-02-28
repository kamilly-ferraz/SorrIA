export { TenantId } from './TenantId';

export class CPF {
  private readonly _value: string;

  constructor(value: string) {
    if (!value) throw new Error('CPF é obrigatório');
    const cleanValue = value.replace(/\D/g, '');
    if (!CPF.isValid(cleanValue)) {
      throw new Error('CPF inválido');
    }
    this._value = cleanValue;
  }

  private static isValid(cpf: string): boolean {
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i), 10) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 > 9) digit1 = 0;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i), 10) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 > 9) digit2 = 0;

    return cpf.charAt(9) === String(digit1) && cpf.charAt(10) === String(digit2);
  }

  get value(): string {
    return this._value;
  }

  format(): string {
    return this._value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  equals(other: CPF): boolean {
    return this._value === other._value;
  }
}

export class Phone {
  private readonly _value: string;
  private readonly _formatted: string;

  constructor(value: string) {
    if (!value) throw new Error('Telefone é obrigatório');
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length < 10 || cleanValue.length > 11) {
      throw new Error('Telefone inválido');
    }
    this._value = cleanValue;
    this._formatted = Phone.formatPhone(cleanValue);
  }

  private static formatPhone(value: string): string {
    if (value.length === 11) {
      return `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7)}`;
    }
    return `(${value.substring(0, 2)}) ${value.substring(2, 6)}-${value.substring(6)}`;
  }

  get value(): string {
    return this._value;
  }

  get formatted(): string {
    return this._formatted;
  }

  equals(other: Phone): boolean {
    return this._value === other._value;
  }
}

export class DateRange {
  private readonly _start: Date;
  private readonly _end: Date;

  constructor(start: Date, end: Date) {
    if (start > end) {
      throw new Error('Data inicial não pode ser maior que data final');
    }
    this._start = start;
    this._end = end;
  }

  get start(): Date {
    return this._start;
  }

  get end(): Date {
    return this._end;
  }

  contains(date: Date): boolean {
    return date >= this._start && date <= this._end;
  }

  overlaps(other: DateRange): boolean {
    return this._start <= other._end && this._end >= other._start;
  }

  get days(): number {
    const diffTime = Math.abs(this._end.getTime() - this._start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

export class TimeSlot {
  private readonly _time: string;
  private readonly _hour: number;
  private readonly _minute: number;

  constructor(time: string) {
    if (!time) throw new Error('Horário é obrigatório');
    
    const parts = time.split(':');
    if (parts.length !== 2) throw new Error('Horário inválido');
    
    const hourStr = parts[0] ?? '';
    const minuteStr = parts[1] ?? '';
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    
    if (isNaN(hour) || isNaN(minute)) {
      throw new Error('Horário inválido');
    }

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      throw new Error('Horário fora do intervalo válido');
    }

    this._hour = hour;
    this._minute = minute;
    this._time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  get time(): string {
    return this._time;
  }

  get hour(): number {
    return this._hour;
  }

  get minute(): number {
    return this._minute;
  }

  isBefore(other: TimeSlot): boolean {
    return this._hour < other._hour || 
      (this._hour === other._hour && this._minute < other._minute);
  }

  isAfter(other: TimeSlot): boolean {
    return other.isBefore(this);
  }

  equals(other: TimeSlot): boolean {
    return this._time === other._time;
  }

  format(): string {
    return this._time;
  }
}

export class Email {
  private readonly _value: string;

  constructor(value: string) {
    if (!value) throw new Error('Email é obrigatório');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('Email inválido');
    }
    this._value = value.toLowerCase();
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }
}

export class Address {
  constructor(
    private readonly _street: string,
    private readonly _number: string,
    private readonly _complement: string = '',
    private readonly _district: string,
    private readonly _city: string,
    private readonly _state: string,
    private readonly _zipCode: string
  ) {}

  get street(): string { return this._street; }
  get number(): string { return this._number; }
  get complement(): string { return this._complement; }
  get district(): string { return this._district; }
  get city(): string { return this._city; }
  get state(): string { return this._state; }
  get zipCode(): string { return this._zipCode; }

  format(): string {
    let address = `${this._street}, ${this._number}`;
    if (this._complement) {
      address += `, ${this._complement}`;
    }
    address += `\n${this._district} - ${this._city}/${this._state}`;
    address += `\n${this._zipCode}`;
    return address;
  }
}
