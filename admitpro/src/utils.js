// src/utils.js

// Generates a short random ID like "A3F9K2"
// Math.random() gives 0.12345...
// .toString(36) converts to base36 (uses letters + numbers)
// .slice(2, 8) takes 6 characters
export function uid() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

// Returns today's date as "2025-01-15"
export function today() {
  return new Date().toISOString().slice(0, 10)
}