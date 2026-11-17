// API base URL is empty in Docker/production so requests go through same-origin Nginx.
// For local Vite development, set VITE_API_URL=http://localhost:5000 in frontend/.env.
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
