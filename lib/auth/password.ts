import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SALT_BYTES = 16;
const KEY_LENGTH = 64;
const HASH_PREFIX = "scrypt";

export function hashPassword(password: string) {
  const normalized = password.normalize("NFKC");
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const derived = scryptSync(normalized, salt, KEY_LENGTH).toString("hex");
  return `${HASH_PREFIX}$${salt}$${derived}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [prefix, salt, expectedHash] = storedHash.split("$");

  if (prefix !== HASH_PREFIX || !salt || !expectedHash) {
    return false;
  }

  const normalized = password.normalize("NFKC");
  const derived = scryptSync(normalized, salt, KEY_LENGTH).toString("hex");

  const expected = Buffer.from(expectedHash, "hex");
  const actual = Buffer.from(derived, "hex");

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}
