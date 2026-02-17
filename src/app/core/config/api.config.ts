/**
 * NASA API configuration.
 *
 * In CI, the placeholder is replaced with the GitHub secret NASA_API_KEY.
 * For local dev, set your key here or use DEMO_KEY (30 req/hr).
 * Get a free key (1,000 req/hr) at https://api.nasa.gov
 */
const _KEY = '__NASA_API_KEY__';
export const NASA_API_KEY = _KEY.startsWith('__') ? 'DEMO_KEY' : _KEY;
export const NASA_API = 'https://api.nasa.gov';
export const NASA_IMAGES_API = 'https://images-api.nasa.gov';
export const ISS_API = 'https://api.wheretheiss.at/v1/satellites/25544';
