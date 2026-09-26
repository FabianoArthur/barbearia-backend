import { decrypt, encrypt, encryptDeterministic, safeDecrypt } from './encryption.util';

describe('encryption.util (AES-256-GCM)', () => {
  const previousKey = process.env.ENCRYPTION_KEY;

  beforeAll(() => {
    process.env.ENCRYPTION_KEY = 'ab'.repeat(32);
  });

  afterAll(() => {
    process.env.ENCRYPTION_KEY = previousKey;
  });

  it('round-trips with a random IV (different ciphertext each time)', () => {
    const a = encrypt('11999998888');
    const b = encrypt('11999998888');
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe('11999998888');
    expect(decrypt(b)).toBe('11999998888');
  });

  it('is deterministic when lookups are needed (same CPF → same ciphertext)', () => {
    expect(encryptDeterministic('52998224725')).toBe(encryptDeterministic('52998224725'));
    expect(encryptDeterministic('52998224725')).not.toBe(encryptDeterministic('12345678909'));
    expect(decrypt(encryptDeterministic('52998224725'))).toBe('52998224725');
  });

  it('detects tampering through the GCM auth tag', () => {
    const [iv, tag, data] = encrypt('secret').split(':');
    const flipped = (data[0] === '0' ? '1' : '0') + data.slice(1);
    expect(() => decrypt(`${iv}:${tag}:${flipped}`)).toThrow();
  });

  it('passes legacy plaintext through safeDecrypt unchanged', () => {
    expect(safeDecrypt('11999998888')).toBe('11999998888');
    expect(safeDecrypt(encrypt('11999998888'))).toBe('11999998888');
  });

  it('refuses to run without a key', () => {
    delete process.env.ENCRYPTION_KEY;
    expect(() => encrypt('x')).toThrow(/ENCRYPTION_KEY/);
    process.env.ENCRYPTION_KEY = 'ab'.repeat(32);
  });
});
