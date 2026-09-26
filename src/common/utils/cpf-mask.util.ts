/**
 * Masks a CPF string, revealing only the first 3 digits.
 * Input: "12345678900" or "123.456.789-00"
 * Output: "123.***.***-**"
 */
export function maskCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');

  if (digits.length < 3) {
    return '***.***.***-**';
  }

  return `${digits.slice(0, 3)}.***.***-**`;
}
