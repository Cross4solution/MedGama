import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_) {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('React ErrorBoundary:', error, info);
    }
    try {
      if (window && window.dispatchEvent) {
        const evt = new CustomEvent('app:error', { detail: { error, info } });
        window.dispatchEvent(evt);
      }
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="p-4 m-4 border rounded bg-red-50 text-red-700">
          <div className="font-semibold mb-1">Bir şeyler ters gitti.</div>
          <div className="text-sm">Sayfayı yenilemeyi deneyin. Sorun devam ederse lütfen daha sonra tekrar deneyin.</div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
