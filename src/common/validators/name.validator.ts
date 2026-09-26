const JUNK_PATTERNS = [
  /^(.)\1{3,}$/i, // Repeated chars: "aaaa", "bbbb"
  /^(abc|qwer|asdf|zxcv)/i, // Keyboard walks
  /^(test|teste|foo|bar|xxx)/i, // Common test names
  /\d{3,}/, // 3+ consecutive digits in name
];

export function isValidClientName(name: string): boolean {
  const trimmed = name.trim();
  const words = trimmed.split(/\s+/).filter((w) => w.length > 0);

  if (words.length < 2) {
    return false;
  }

  if (words.some((w) => w.length < 2)) {
    return false;
  }

  for (const pattern of JUNK_PATTERNS) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }

  return true;
}
