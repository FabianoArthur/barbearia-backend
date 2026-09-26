import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const ENCODING = 'hex' as const;

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  return Buffer.from(key, ENCODING);
}

/**
 * Derives a deterministic IV from the plaintext using HMAC-SHA256.
 * Same plaintext always produces the same IV, enabling DB lookups on encrypted fields.
 */
function deriveIv(plaintext: string): Buffer {
  const hmac = createHmac('sha256', getKey());
  hmac.update(plaintext);
  return hmac.digest().subarray(0, IV_LENGTH);
}

function pack(iv: Buffer, tag: Buffer, encrypted: Buffer): string {
  return `${iv.toString(ENCODING)}:${tag.toString(ENCODING)}:${encrypted.toString(ENCODING)}`;
}

function unpack(ciphertext: string): { iv: Buffer; tag: Buffer; encrypted: Buffer } {
  const [ivHex, tagHex, encHex] = ciphertext.split(':');
  return {
    iv: Buffer.from(ivHex, ENCODING),
    tag: Buffer.from(tagHex, ENCODING),
    encrypted: Buffer.from(encHex, ENCODING),
  };
}

/**
 * Deterministic AES-256-GCM encryption.
 * Same plaintext always produces the same ciphertext — use for fields that need DB lookups (e.g. CPF).
 */
export function encryptDeterministic(plaintext: string): string {
  const key = getKey();
  const iv = deriveIv(plaintext);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return pack(iv, tag, encrypted);
}

/**
 * Non-deterministic AES-256-GCM encryption with random IV.
 * Use for fields that don't need lookups (e.g. phone).
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return pack(iv, tag, encrypted);
}

/**
 * Decrypts an AES-256-GCM ciphertext string (iv:tag:data).
 */
export function decrypt(ciphertext: string): string {
  const key = getKey();
  const { iv, tag, encrypted } = unpack(ciphertext);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
}

/**
 * Returns true if the value looks like an encrypted string (iv:tag:data hex format).
 */
function isEncrypted(value: string): boolean {
  const parts = value.split(':');
  if (parts.length !== 3) return false;
  return parts.every((part) => /^[0-9a-f]+$/i.test(part));
}

/**
 * Safely decrypts a value. Returns plaintext as-is if it's not in encrypted format.
 * Use during migration periods when the DB may contain both encrypted and unencrypted data.
 */
export function safeDecrypt(value: string): string {
  return isEncrypted(value) ? decrypt(value) : value;
}
