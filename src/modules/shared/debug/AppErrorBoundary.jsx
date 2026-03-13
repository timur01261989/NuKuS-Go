import React from 'react';

function getErrorMessage(error) {
  if (!error) return 'Unknown application error';
  if (typeof error === 'string') return error;
  return error.message || 'Unknown application error';
}

export default class AppErrorBoundary extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
    this.handleReload = this.handleReload.bind(this);
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    try {
      console.error('[AppErrorBoundary]', error, errorInfo);
    } catch {
      // ignore console failures
    }
  }

  handleReload() {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-10 text-slate-900">
        <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-2xl">!</div>
            <div>
              <h1 className="text-2xl font-bold">Ilovada xatolik yuz berdi</h1>
              <p className="mt-1 text-sm text-slate-500">Sahifa tiklanishi uchun qayta yuklab ko‘ring.</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700 break-words">
            {getErrorMessage(this.state.error)}
          </div>

          <button
            type="button"
            onClick={this.handleReload}
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Qayta yuklash
          </button>
        </div>
      </div>
    );
  }
}
