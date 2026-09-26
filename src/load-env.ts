/**
 * Loads `.env` into process.env for local development. Imported first in main.ts because
 * several modules read configuration while their decorators are evaluated at import time.
 * Containers and CI inject real environment variables and have no .env file.
 */
try {
  process.loadEnvFile();
} catch {
  // No .env file: rely on the real environment.
}
