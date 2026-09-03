// Loaded before every test file (see vitest.config.ts `setupFiles`).
// Unit tests mock repositories/services directly and never touch a real
// database, but importing modules still pulls in src/config/env.ts, which
// exits the process if required variables are missing. Providing safe
// dummy values here keeps the whole suite from crashing on import.
process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??= "postgres://test:test@localhost:5432/test";
process.env.JWT_SECRET ??= "test-only-secret-not-used-for-anything-real";
