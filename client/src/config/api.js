// Centralized API configuration for the application.
// All backend URLs are derived from environment variables set in .env files.
// In development: VITE_API_URL defaults to http://localhost:5000
// In production:  VITE_API_URL points to the deployed backend.

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";
