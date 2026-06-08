import React from 'react';
import ReactDOM from 'react-dom/client';
import './assets/index.css';
import App from './App';
import ErrorBoundary from './components/common/ErrorBoundary';
import { setupPerformanceObserver } from './utils/perf';

// Production'da console.log/info/debug çıktılarını sustur (warn ve error kalır)
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
}

const root = ReactDOM.createRoot(document.getElementById('root'));
if (process.env.NODE_ENV !== 'production') {
  try { setupPerformanceObserver(); } catch {}
}

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
