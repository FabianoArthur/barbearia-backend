import { isValidCpf, normalizeCpf } from './cpf.validator';

describe('cpf.validator', () => {
  it('accepts valid CPFs with or without punctuation', () => {
    expect(isValidCpf('52998224725')).toBe(true);
    expect(isValidCpf('529.982.247-25')).toBe(true);
  });

  it('rejects wrong check digits', () => {
    expect(isValidCpf('52998224724')).toBe(false);
    expect(isValidCpf('52998224715')).toBe(false);
  });

  it('rejects repeated digits and wrong lengths', () => {
    expect(isValidCpf('11111111111')).toBe(false);
    expect(isValidCpf('1234567890')).toBe(false);
    expect(isValidCpf('')).toBe(false);
  });

  it('normalizes to digits only', () => {
    expect(normalizeCpf('529.982.247-25')).toBe('52998224725');
  });
});
