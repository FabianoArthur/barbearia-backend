/**
 * Seed passwords come from the environment so no credential is committed to the repo.
 * See `.env.example` for the variables.
 */
export function requireSeedPassword(name: 'SEED_ADMIN_PASSWORD' | 'SEED_USER_PASSWORD'): string {
  const value = process.env[name];
  if (!value || value.length < 8) {
    throw new Error(`${name} must be set (min. 8 characters) before seeding. See .env.example.`);
  }
  return value;
}
