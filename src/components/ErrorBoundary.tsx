import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by Sound Engine ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleReturnHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4 sm:p-6 selection:bg-amber-400 selection:text-neutral-950 font-sans">
          <div className="w-full max-w-lg rounded-3xl bg-neutral-900 border border-white/10 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-400/10">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400">
                AUDIO ENGINE CIRCUIT BREAKER
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
                Transmission Interrupted
              </h1>
              <p className="text-sm text-neutral-400 leading-relaxed max-w-md mx-auto">
                An unexpected interruption occurred in the audio sound engine. Your stored SQLite database records are safe.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3.5 rounded-xl bg-black/50 border border-white/10 text-xs font-mono text-neutral-300 text-left overflow-x-auto max-h-24">
                <span className="text-amber-400 font-bold">Status: </span>
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReturnHome}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-white/10 text-neutral-300 hover:text-white hover:bg-white/5 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Return to Home</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-display font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-400/25 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Sound Engine</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
