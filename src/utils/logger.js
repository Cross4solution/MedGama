export const logger = (() => {
  const levels = ['error', 'warn', 'info', 'debug'];
  const level = levels.indexOf(process.env.REACT_APP_LOG_LEVEL || 'info');

  const log = (level, ...args) => {
    if (levels.indexOf(level) >= level) console[level](...args);
  };

  return {
    error: (...args) => log('error', ...args),
    warn: (...args) => log('warn', ...args),
    info: (...args) => log('info', ...args),
    debug: (...args) => log('debug', ...args),
  };
})();
