import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export function ErrorBoundary({ children }: Props) {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | undefined>();

  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    console.error('Uncaught error:', error, errorInfo);
    setHasError(true);
    setError(error);
  };

  const handleReset = () => {
    setHasError(false);
    setError(undefined);
  };

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Ocorreu um erro</h2>
          <p className="text-muted-foreground">
            Algo inesperado aconteceu. Por favor, recarrega a página.
          </p>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Recarregar Página
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                Ver detalhes do erro
              </summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                {error?.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
