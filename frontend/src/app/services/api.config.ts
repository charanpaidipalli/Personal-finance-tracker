const isLocalDevelopment = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const apiOrigin = isLocalDevelopment
  ? `${window.location.protocol}//${window.location.hostname}:5100`
  : window.location.origin;

export const API_BASE_URL = `${apiOrigin}/api`;
