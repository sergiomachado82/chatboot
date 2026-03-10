import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600">Algo salio mal</h1>
          <p className="text-gray-600 max-w-md">
            Ocurrio un error inesperado. Por favor, recarga la pagina para continuar.
          </p>
          {this.state.error && (
            <pre className="text-sm text-gray-500 max-w-lg overflow-auto p-2 bg-gray-100 rounded">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReload}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Recargar pagina
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
