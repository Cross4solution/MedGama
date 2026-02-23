/**
 * Resolve API base URL at runtime.
 *
 * On Vercel (*.vercel.app): uses "/api" which is proxied to Railway
 * via vercel.json rewrite. Same-origin = no CORS.
 *
 * On localhost / other: uses REACT_APP_API_BASE env var or default.
 */
function resolve() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.endsWith('.vercel.app') || host === 'medagama.com' || host === 'www.medagama.com') {
      return '/api';
    }
  }
  return (process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8001/api').replace(/\/+$/, '');
}

export const API_BASE_URL = resolve();
