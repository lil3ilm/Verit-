import * as React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-[#F9F9F9]">
          <div className="max-w-md w-full p-8 bg-white rounded-[2.5rem] border border-black/5 shadow-xl text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Something went wrong</h2>
            <p className="text-black/40 text-sm mb-8 leading-relaxed">
              An unexpected error occurred. We've been notified and are looking into it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 w-full p-4 bg-black text-white rounded-2xl font-medium hover:bg-black/90 transition-all active:scale-95"
            >
              <RefreshCcw size={18} />
              <span>Reload Application</span>
            </button>
            {(import.meta as any).env?.MODE === 'development' && (
              <pre className="mt-8 p-4 bg-black/5 rounded-xl text-left text-[10px] overflow-auto max-h-32 text-black/60">
                {this.state.error?.message}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
