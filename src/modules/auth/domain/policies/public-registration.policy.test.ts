import { isPublicRegistrationAllowed } from './public-registration.policy';

describe('isPublicRegistrationAllowed', () => {
  it('is allowed by default outside production (local dev and tests)', () => {
    expect(isPublicRegistrationAllowed({ NODE_ENV: 'development' })).toBe(true);
    expect(isPublicRegistrationAllowed({})).toBe(true);
  });

  it('is closed by default in production', () => {
    expect(isPublicRegistrationAllowed({ NODE_ENV: 'production' })).toBe(false);
  });

  it('honours an explicit ALLOW_PUBLIC_REGISTRATION flag in any environment', () => {
    expect(
      isPublicRegistrationAllowed({ NODE_ENV: 'production', ALLOW_PUBLIC_REGISTRATION: 'true' }),
    ).toBe(true);
    expect(
      isPublicRegistrationAllowed({ NODE_ENV: 'development', ALLOW_PUBLIC_REGISTRATION: 'false' }),
    ).toBe(false);
  });

  it('treats unrecognised flag values as closed', () => {
    expect(isPublicRegistrationAllowed({ ALLOW_PUBLIC_REGISTRATION: 'yes please' })).toBe(false);
  });
});
