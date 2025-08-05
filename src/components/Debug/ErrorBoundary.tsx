import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🚨</div>
              <h1 className="text-2xl font-bold text-red-600 mb-2">CineConnect Error</h1>
              <p className="text-gray-600">Something went wrong while loading the application.</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">Error Details:</h3>
                <pre className="text-sm text-red-700 overflow-auto">
                  {this.state.error?.toString()}
                </pre>
              </div>

              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Environment Check:</h3>
                <div className="text-sm space-y-1">
                  <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</div>
                  <div>Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</div>
                  <div>TMDB Key: {import.meta.env.VITE_TMDB_API_KEY ? '✅ Set' : '⚠️ Optional'}</div>
                  <div>Environment: {import.meta.env.MODE}</div>
                </div>
              </div>

              {this.state.errorInfo && (
                <details className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                  <summary className="font-semibold text-gray-800 cursor-pointer">Stack Trace</summary>
                  <pre className="text-xs text-gray-600 mt-2 overflow-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Quick Fixes:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Check Netlify environment variables are set correctly</li>
                  <li>• Verify Supabase URL and Anon Key are valid</li>
                  <li>• Try refreshing the page</li>
                  <li>• Open browser console for more details</li>
                </ul>
              </div>

              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;