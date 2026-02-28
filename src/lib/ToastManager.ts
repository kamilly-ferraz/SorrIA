import { toast as sonnerToast, Toaster } from 'sonner';
import type { ToasterProps } from 'sonner';

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export class ToastManager {
  private static instance: ToastManager;
  private defaultDuration = 5000;

  private constructor() {}

  public static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  public setDefaultDuration(duration: number): void {
    this.defaultDuration = duration;
  }

  public show(options: ToastOptions): string {
    const id = sonnerToast(options.title || '', {
      description: options.description,
      duration: options.duration || this.defaultDuration,
    });
    return id as string;
  }

  public success(title: string, description?: string): string {
    const id = sonnerToast.success(title, {
      description: description,
      duration: this.defaultDuration,
    });
    return id as string;
  }

  public error(title: string, description?: string): string {
    const id = sonnerToast.error(title, {
      description: description,
      duration: 8000,
    });
    return id as string;
  }

  public warning(title: string, description?: string): string {
    const id = sonnerToast.warning(title, {
      description: description,
      duration: this.defaultDuration,
    });
    return id as string;
  }

  public info(title: string, description?: string): string {
    const id = sonnerToast.info(title, {
      description: description,
      duration: this.defaultDuration,
    });
    return id as string;
  }

  public loading(title: string, description?: string): string {
    const id = sonnerToast.loading(title, {
      description: description,
    });
    return id as string;
  }

  public dismiss(id: string): void {
    sonnerToast.dismiss(id);
  }

  public clearAll(): void {
    sonnerToast.dismiss();
  }

  public promise<T>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ): Promise<T> {
    return sonnerToast.promise(promise, {
      loading: options.loading,
      success: options.success,
      error: options.error,
    });
  }
}

export const toastManager = ToastManager.getInstance();

export function toast(options: ToastOptions): { id: string; dismiss: () => void } {
  const id = toastManager.show(options);
  return {
    id,
    dismiss: () => toastManager.dismiss(id),
  };
}

export const toastSuccess = (title: string, description?: string) => 
  toastManager.success(title, description);

export const toastError = (title: string, description?: string) => 
  toastManager.error(title, description);

export const toastWarning = (title: string, description?: string) => 
  toastManager.warning(title, description);

export const toastInfo = (title: string, description?: string) => 
  toastManager.info(title, description);

export const toastLoading = (title: string, description?: string) => 
  toastManager.loading(title, description);

export const dismissToast = (id: string) => toastManager.dismiss(id);

export const clearAllToasts = () => toastManager.clearAll();

export function toastPromise<T>(
  promise: Promise<T>,
  options: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }
): Promise<T> {
  return toastManager.promise(promise, options);
}

export { Toaster };
