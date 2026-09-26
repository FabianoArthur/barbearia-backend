import { isValidBrazilianPhone, normalizePhoneE164 } from './phone.validator';

describe('isValidBrazilianPhone', () => {
  describe('valid phones', () => {
    it.each([
      '11999998888',
      '(11) 99999-8888',
      '+5511999998888',
      '11 98765-4321',
      '21987654321',
    ])('accepts "%s"', (phone) => {
      expect(isValidBrazilianPhone(phone)).toBe(true);
    });
  });

  describe('invalid phones', () => {
    it.each([
      '',
      '123',
      '123456789', // too short
      '123456789012345', // too long
      'abc',
    ])('rejects "%s"', (phone) => {
      expect(isValidBrazilianPhone(phone)).toBe(false);
    });
  });
});

describe('normalizePhoneE164', () => {
  it('produces +55 format for 10-digit landline', () => {
    expect(normalizePhoneE164('1133334444')).toBe('+551133334444');
  });

  it('produces +55 format for 11-digit mobile', () => {
    expect(normalizePhoneE164('11999998888')).toBe('+5511999998888');
  });

  it('produces +55 format for formatted input', () => {
    expect(normalizePhoneE164('(11) 99999-8888')).toBe('+5511999998888');
  });

  it('preserves +55 when already present', () => {
    expect(normalizePhoneE164('+5511999998888')).toBe('+5511999998888');
  });

  it('throws for invalid phone', () => {
    expect(() => normalizePhoneE164('123')).toThrow('Invalid phone number');
  });
});
