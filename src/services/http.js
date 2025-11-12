const BASE = process.env.REACT_APP_API_BASE || '/';

function buildUrl(path) {
  if (!path) return BASE;
  try {
    return new URL(path, BASE).toString();
  } catch {
    return `${BASE.replace(/\/$/, '')}/${String(path).replace(/^\//, '')}`;
  }
}

async function parseResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  let data;
  try { data = isJson ? await res.json() : await res.text(); } catch { data = null; }
  if (!res.ok) {
    const err = {
      status: res.status,
      data: data && typeof data === 'object' ? data : { message: String(data || res.statusText) },
      message: (data && data.message) || res.statusText || 'Request error'
    };
    if (res.status === 401) {
      try { localStorage.removeItem('access_token'); } catch {}
    }
    throw err;
  }
  return data;
}

async function request(path, options = {}) {
  const headers = Object.assign({}, options.headers || {});
  try {
    const token = localStorage.getItem('access_token');
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {}

  /** @type {RequestInit} */
  const init = {
    method: options.method || 'GET',
    headers,
    credentials: /** @type {RequestCredentials} */ ('include'),
    mode: /** @type {RequestMode} */ (options.mode || 'cors'),
    cache: /** @type {RequestCache} */ (options.cache || 'no-store'),
  };

  if (options.body != null) {
    if (options.json !== false) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      init.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    } else {
      init.body = options.body;
    }
  }

  const res = await fetch(buildUrl(path), init);
  return parseResponse(res);
}

const http = {
  request,
  get: (path, opts) => request(path, { ...(opts || {}), method: 'GET' }),
  post: (path, body, opts) => request(path, { ...(opts || {}), method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...(opts || {}), method: 'PUT', body }),
  patch: (path, body, opts) => request(path, { ...(opts || {}), method: 'PATCH', body }),
  delete: (path, opts) => request(path, { ...(opts || {}), method: 'DELETE' })
};

export default http;
