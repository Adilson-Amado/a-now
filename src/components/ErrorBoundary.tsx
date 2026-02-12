import React, { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Copy } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  attemptCount: number;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      attemptCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    console.error(`Error ID: ${errorId}`, error);
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState((prev) => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: undefined,
      attemptCount: prev.attemptCount + 1,
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  handleCopyError = () => {
    const { error, errorId } = this.state;
    if (error && errorId) {
      navigator.clipboard.writeText(
        `Error ID: ${errorId}\n\nError: ${error.message}\n\nStack: ${error.stack || 'N/A'}`
      );
    }
  };

  render() {
    const { hasError, error, errorId, attemptCount } = this.state;

    if (hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-background">
          <div className="max-w-lg w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-destructive/10">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Ocorreu um erro</h2>
              <p className="text-muted-foreground">
                Algo inesperado aconteceu. O aplicativo pode estar em um estado inconsistente.
              </p>
              {errorId && (
                <p className="text-xs text-muted-foreground font-mono">
                  ID do erro: {errorId}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar Recuperar {attemptCount > 0 && `(${attemptCount})`}
              </button>
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
              >
                Recarregar Página
              </button>
            </div>

            {error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Ver detalhes do erro
                </summary>
                <div className="mt-2 rounded-md bg-muted p-4 overflow-auto">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {error.name}: {error.message}
                    </span>
                    <button
                      onClick={this.handleCopyError}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3 w-3" />
                      Copiar
                    </button>
                  </div>
                  {error.stack && (
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                      {error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {errorId && (
              <div className="mt-4 p-3 bg-muted rounded-md text-xs text-muted-foreground">
                <p>
                  Se o problema persistir, contacte o suporte com o ID do erro:{' '}
                  <span className="font-mono select-all">{errorId}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper component
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
