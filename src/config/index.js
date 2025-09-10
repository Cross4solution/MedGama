// Çalışma zamanı konfigürasyonu (CRA: REACT_APP_ prefix zorunlu)

const bool = (v, def = false) => {
  if (v === undefined) return def;
  return String(v).toLowerCase() === 'true';
};

export const config = Object.freeze({
  env: process.env.NODE_ENV || 'development',
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || '',
  enableMock: bool(process.env.REACT_APP_ENABLE_MOCK, false),
});

export default config;
