import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Make Pusher available globally (required by laravel-echo)
window.Pusher = Pusher;

/**
 * Laravel Echo instance for real-time WebSocket communication.
 *
 * Supports two modes based on env vars:
 * 1. Pusher/Ably (cloud): REACT_APP_PUSHER_APP_KEY + REACT_APP_PUSHER_CLUSTER
 * 2. Laravel Reverb (self-hosted): REACT_APP_REVERB_APP_KEY + REACT_APP_REVERB_HOST
 *
 * Auth token is read from localStorage on each connection attempt.
 */

function getAuthToken() {
  try {
    const fromState = JSON.parse(localStorage.getItem('auth_state') || '{}')?.token;
    return fromState || localStorage.getItem('access_token') || '';
  } catch {
    return '';
  }
}

const apiBase = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8001/api';
// Derive the host origin from apiBase (strip /api suffix)
const wsAuthHost = apiBase.replace(/\/api\/?$/, '');

// Reverb (self-hosted) config
const reverbKey = process.env.REACT_APP_REVERB_APP_KEY;
const reverbHost = process.env.REACT_APP_REVERB_HOST || '127.0.0.1';
const reverbPort = process.env.REACT_APP_REVERB_PORT || '8080';

// Pusher (cloud) config
const pusherKey = process.env.REACT_APP_PUSHER_APP_KEY;
const pusherCluster = process.env.REACT_APP_PUSHER_CLUSTER || 'eu';

const echoConfig = reverbKey
  ? {
      // Laravel Reverb (self-hosted WebSocket server)
      broadcaster: 'reverb',
      key: reverbKey,
      wsHost: reverbHost,
      wsPort: parseInt(reverbPort, 10),
      wssPort: parseInt(reverbPort, 10),
      forceTLS: reverbHost !== '127.0.0.1' && reverbHost !== 'localhost',
      enabledTransports: ['ws', 'wss'],
      authEndpoint: `${wsAuthHost}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          Accept: 'application/json',
        },
      },
    }
  : pusherKey
    ? {
        // Pusher (cloud)
        broadcaster: 'pusher',
        key: pusherKey,
        cluster: pusherCluster,
        forceTLS: true,
        authEndpoint: `${wsAuthHost}/broadcasting/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            Accept: 'application/json',
          },
        },
      }
    : null;

/**
 * Create or return the Echo instance.
 * Returns null if no WebSocket config is available (graceful degradation to polling).
 */
let echoInstance = null;

export function getEcho() {
  if (!echoConfig) return null;

  if (!echoInstance) {
    echoInstance = new Echo(echoConfig);
  }

  // Refresh auth token on every access
  try {
    const token = getAuthToken();
    if (echoInstance.connector?.pusher?.config?.auth?.headers) {
      echoInstance.connector.pusher.config.auth.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}

  return echoInstance;
}

/**
 * Disconnect and reset the Echo instance (call on logout).
 */
export function disconnectEcho() {
  if (echoInstance) {
    try { echoInstance.disconnect(); } catch {}
    echoInstance = null;
  }
}

export default getEcho;
