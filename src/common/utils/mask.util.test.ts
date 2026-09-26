import { maskCpf } from './cpf-mask.util';
import { maskPhone } from './phone-mask.util';

describe('masking helpers', () => {
  it('keeps only the first 3 CPF digits', () => {
    expect(maskCpf('52998224725')).toBe('529.***.***-**');
    expect(maskCpf('529.982.247-25')).toBe('529.***.***-**');
    expect(maskCpf('1')).toBe('***.***.***-**');
  });

  it('keeps only the last 4 phone digits, ignoring formatting', () => {
    expect(maskPhone('11999998888')).toBe('*******8888');
    expect(maskPhone('whatsapp:+5511999998888')).toBe('*********8888');
    expect(maskPhone('123')).toBe('123');
  });
});
