/**
 * Utilitário de logging para desenvolvimento
 * Logs são exibidos apenas em modo desenvolvimento
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log('[DEV]', ...args);
  },

  error: (...args: unknown[]) => {
    if (isDev) console.error('[DEV ERROR]', ...args);
  },

  warn: (...args: unknown[]) => {
    if (isDev) console.warn('[DEV WARN]', ...args);
  },
};
