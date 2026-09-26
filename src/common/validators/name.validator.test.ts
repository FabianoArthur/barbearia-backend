import { isValidClientName } from './name.validator';

describe('isValidClientName', () => {
  describe('valid names', () => {
    it.each(['Carlos Silva', 'Ana Maria Santos', 'João da Silva'])('accepts "%s"', (name) => {
      expect(isValidClientName(name)).toBe(true);
    });
  });

  describe('invalid names', () => {
    it('rejects single word', () => {
      expect(isValidClientName('Carlos')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(isValidClientName('')).toBe(false);
    });

    it('rejects "test teste"', () => {
      expect(isValidClientName('test teste')).toBe(false);
    });

    it('rejects "abc def" (keyboard walk)', () => {
      expect(isValidClientName('abc def')).toBe(false);
    });

    it('rejects "foo bar"', () => {
      expect(isValidClientName('foo bar')).toBe(false);
    });

    it('rejects "a b" (words < 2 chars)', () => {
      expect(isValidClientName('a b')).toBe(false);
    });
  });
});
