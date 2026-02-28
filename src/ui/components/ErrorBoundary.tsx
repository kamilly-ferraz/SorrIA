import { Component, ReactNode, ErrorInfo } from 'react';
import { getErrorCode } from '@/shared/errors';

interface ErrorBoundaryProps {
  /** Filhos que serão envolvidos */
  children: ReactNode;
  /** Fallback UI quando ocorrer um erro */
  fallback?: ReactNode;
  /** Callback chamado quando ocorrer um erro */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Chave para resetar o estado de erro */
  resetKeys?: unknown[];
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Componente de erro padrão
 */
export function DefaultErrorFallback({ 
  error, 
  resetError 
}: { 
  error: Error | null;
  resetError: () => void;
}) {
  const errorCode = error ? getErrorCode(error) : 'UNKNOWN';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        {/* Ícone de erro */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <svg 
            className="w-8 h-8 text-red-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>

        {/* Título do erro */}
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Algo deu errado
        </h1>

        {/* Mensagem do erro */}
        <p className="text-gray-600 mb-4">
          {error?.message || 'Ocorreu um erro inesperado. Por favor, tente novamente.'}
        </p>

        {/* Código de erro */}
        <div className="bg-gray-100 rounded p-2 mb-4">
          <span className="text-xs text-gray-500">Código: </span>
          <code className="text-xs font-mono text-gray-700">{errorCode}</code>
        </div>

        {/* Ações */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={resetError}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Recarregar página
          </button>
        </div>

        {/* Mensagem de suporte */}
        <p className="mt-4 text-xs text-gray-500">
          Se o problema persistir, entre em contato com o suporte.
        </p>
      </div>
    </div>
  );
}

/**
 * Error Boundary - Componente de classe para capturar erros
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      errorInfo,
    });

    // Log do erro (pode ser integrado com Sentry externamente se necessário)
    this.props.onError?.(error, errorInfo);
    console.error('ErrorBoundary capturou erro:', error, errorInfo);
  }

  // Reset error state - this method is called by the fallback UI
  // Using arrow function to avoid override issues
  public resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public override render() {
    if (this.state.hasError) {
      // Fallback customizado
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback padrão
      return (
        <DefaultErrorFallback 
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Hook para usar Error Boundary programaticamente
 * Útil para resetar erros em componentes funcionais
 * 
 * @example
 * const { triggerError } = useErrorHandler();
 * 
 * if (someError) {
 *   triggerError(new Error('Algo deu errado'));
 * }
 */
export function useErrorHandler() {
  return {
    /**
     * Dispara um erro que será capturado pelo Error Boundary
     */
    triggerError: (error: Error) => {
      throw error;
    },
  };
}

/**
 * HOC para adicionar Error Boundary a um componente
 * 
 * @example
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   fallback: <CustomError />,
 *   onError: (error) => console.error(error)
 * });
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
