import React from 'react';
import { AlertTriangle, RefreshCw, Home, LogOut } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[SENTRIX SafeGuard] Component tree error intercepted:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleResetSession = () => {
    try {
      localStorage.removeItem('sentrix_auth_token');
    } catch (e) {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-slate-50">
          <div className="max-w-xl w-full bg-white border border-red-200 rounded-2xl shadow-lg p-6 sm:p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-200">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 uppercase tracking-wider">
                ANVESH UI Safeguard Active
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 mt-2">
                A View Rendering Error Was Safely Intercepted
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                An unexpected component render exception occurred in this section. The application prevented a total crash to protect your grievance session data.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-900 text-slate-200 rounded-xl p-3 text-left font-mono text-[11px] overflow-x-auto max-h-32 border border-slate-700">
                <span className="text-red-400 font-bold block mb-1">Exception:</span>
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#0845A8] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Dashboard</span>
              </button>

              <button
                onClick={this.handleResetSession}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                <span>Reset Session & Login</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
