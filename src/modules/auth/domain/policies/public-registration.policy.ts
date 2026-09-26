/**
 * `POST /auth/register` lets the caller choose any role, so it must not be open on a
 * production deployment unless the operator opts in explicitly.
 *
 * - `ALLOW_PUBLIC_REGISTRATION=true|false` wins in every environment.
 * - Unset: open outside production (local dev, tests), closed in production.
 */
export function isPublicRegistrationAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  const flag = env.ALLOW_PUBLIC_REGISTRATION;
  if (flag === undefined || flag === '') return env.NODE_ENV !== 'production';
  return flag.trim().toLowerCase() === 'true';
}
