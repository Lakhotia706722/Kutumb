'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Catches unhandled React render errors so the whole app doesn't go blank.
 * Placed at the root of the authenticated layout.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    // In production you'd send this to an error tracker (Sentry, etc.)
    console.error('[ErrorBoundary]', error);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
            <span className="text-4xl mb-4">😕</span>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              An unexpected error occurred. Your data is safe — please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm font-medium text-orange-600 hover:underline"
            >
              Refresh page
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
