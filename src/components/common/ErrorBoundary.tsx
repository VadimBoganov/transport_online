import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Можно отправить ошибку в систему логирования
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="app-error-boundary">
          <h2>Что-то пошло не так</h2>
          <p>Попробуйте обновить страницу. Если проблема повторяется, обратитесь к разработчику.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

