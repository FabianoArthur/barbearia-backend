/**
 * Masks a phone number, revealing only the last 4 digits.
 * Input: "11999998888"
 * Output: "*******8888"
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.length <= 4) {
    return digits;
  }

  return '*'.repeat(digits.length - 4) + digits.slice(-4);
}
