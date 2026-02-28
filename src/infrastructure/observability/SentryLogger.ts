import { LoggerPort } from '@/application/ports/LoggerPort';
import { LogLevel } from '@/lib/Logger';

interface SentryEvent {
  tags?: Record<string, string>;
}

type SentrySeverityLevel = 'debug' | 'info' | 'warning' | 'error' | 'fatal';

type SentryBreadcrumbLevel = 'debug' | 'info' | 'warning' | 'error';

interface SentryUser {
  id?: string;
  email?: string;
  username?: string;
  ip_address?: string;
}

interface SentrySpan {
  name: string;
  op: string;
}

export interface SentryLoggerConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate?: number;
  sampleRate?: number;
  ignoreErrors?: (RegExp | string)[];
}

const SentryMock = {
  init: (_config: unknown) => {
    console.warn('Sentry não instalado. Execute: npm install @sentry/react');
  },
  captureMessage: (_message: string, _level?: SentrySeverityLevel) => {},
  captureException: (_error: unknown, _context?: Record<string, unknown>) => {},
  setContext: (_name: string, _context: Record<string, unknown>) => {},
  setUser: (_user: SentryUser | null) => {},
  setTag: (_key: string, _value: string) => {},
  addBreadcrumb: (_breadcrumb: { message: string; category: string; level: SentryBreadcrumbLevel; timestamp: number }) => {},
  startSpan: <T>(_span: SentrySpan, fn: () => T): T => fn(),
};

const Sentry = SentryMock;

export class SentryLoggerAdapter implements LoggerPort {
  private context: Record<string, unknown> = {};
  private readonly minLevel: LogLevel;
  private initialized = false;

  constructor(config: SentryLoggerConfig, minLevel: LogLevel = LogLevel.ERROR) {
    this.minLevel = minLevel;
    
    if (config?.dsn && config.dsn.length > 0) {
      try {
        this.initialized = true;
      } catch {
        console.warn('Falha ao inicializar Sentry, usando modo mock');
      }
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const minIndex = levels.indexOf(this.minLevel);
    const currentIndex = levels.indexOf(level);
    return currentIndex >= minIndex;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      Sentry.captureMessage(message, 'debug');
      console.debug(`[Sentry] ${message}`, { ...this.context, ...context });
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      Sentry.captureMessage(message, 'info');
      console.info(`[Sentry] ${message}`, { ...this.context, ...context });
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      Sentry.captureMessage(message, 'warning');
      console.warn(`[Sentry] ${message}`, { ...this.context, ...context });
    }
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      if (error) {
        Sentry.captureException(error, { extra: { ...this.context, ...context, customMessage: message } });
      } else {
        Sentry.captureMessage(message, 'error');
      }
      console.error(`[Sentry] ${message}`, { error, ...this.context, ...context });
    }
  }

  child(additionalContext: Record<string, unknown>): LoggerPort {
    const child = new SentryLoggerAdapter({ dsn: '', environment: 'development' }, this.minLevel);
    child.setContext({ ...this.context, ...additionalContext });
    return child;
  }

  setContext(context: Record<string, unknown>): void {
    this.context = { ...this.context, ...context };
    Sentry.setContext('app', this.context);
  }

  clearContext(): void {
    this.context = {};
    Sentry.setContext('app', {});
  }

  startTransaction<T>(name: string, op: string, fn: () => T): T {
    return Sentry.startSpan({ name, op }, fn);
  }

  addBreadcrumb(message: string, category?: string, level?: SentryBreadcrumbLevel): void {
    Sentry.addBreadcrumb({
      message,
      category: category ?? 'app',
      level: level ?? 'info',
      timestamp: Date.now() / 1000,
    });
  }
}

export function useSentry() {
  return {
    captureException: (error: Error, context?: Record<string, unknown>) => {
      console.error('[Sentry] Exception captured:', error, context);
    },
    captureMessage: (message: string, level?: SentrySeverityLevel) => {
      console.log(`[Sentry] Message (${level}):`, message);
    },
    addBreadcrumb: (message: string, category?: string) => {
      console.debug(`[Sentry] Breadcrumb [${category ?? 'app'}]:`, message);
    },
    setUser: (user: SentryUser | null) => {
      console.debug('[Sentry] User set:', user);
    },
    setTag: (key: string, value: string) => {
      console.debug(`[Sentry] Tag ${key}:`, value);
    },
    startTransaction: Sentry.startSpan,
  };
}

export function createSentryConfig(): SentryLoggerConfig | null {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.info('Sentry DSN não configurado. Execute npm install @sentry/react e configure VITE_SENTRY_DSN');
    return null;
  }

  return {
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION,
    tracesSampleRate: 0.1,
    sampleRate: 1.0,
    ignoreErrors: [/ResizeObserver/, /Network Error/, /Failed to fetch/],
  };
}

export function createSentryLogger(): LoggerPort | null {
  const config = createSentryConfig();
  
  if (!config) {
    return null;
  }

  return new SentryLoggerAdapter(config);
}
