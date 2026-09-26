/**
 * Normalizes a Brazilian phone number to E.164 format.
 * Accepts: "11999998888", "(11) 99999-8888", "+5511999998888"
 * Returns: "+5511999998888"
 */
export function normalizePhoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return `+${digits}`;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }

  throw new Error(`Invalid phone number: ${phone}`);
}

/**
 * Validates if a string looks like a valid Brazilian phone number.
 */
export function isValidBrazilianPhone(phone: string): boolean {
  try {
    normalizePhoneE164(phone);
    return true;
  } catch {
    return false;
  }
}
