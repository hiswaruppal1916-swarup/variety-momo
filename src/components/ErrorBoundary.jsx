import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-lg shadow-rose-950/50">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h1 className="font-outfit font-extrabold text-2xl sm:text-3xl text-white tracking-tight mb-2">
            Something went wrong
          </h1>

          <p className="text-stone-400 text-xs sm:text-sm max-w-md mb-6 leading-relaxed">
            An unexpected error occurred while loading this section. You can reload the page or return to the storefront.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Page</span>
            </button>

            <button
              onClick={this.handleGoHome}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold border border-stone-700 transition-all active:scale-95"
            >
              <Home className="w-4 h-4" />
              <span>Go to Store</span>
            </button>
          </div>

          {this.state.error && (
            <div className="mt-8 max-w-lg w-full text-left p-3.5 rounded-xl bg-stone-900 border border-stone-800 text-[11px] text-stone-400 overflow-x-auto font-mono">
              <span className="text-rose-400 font-bold block mb-1">
                {this.state.error.toString()}
              </span>
              {this.state.errorInfo?.componentStack && (
                <pre className="text-[10px] text-stone-500 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack.slice(0, 400)}
                </pre>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
