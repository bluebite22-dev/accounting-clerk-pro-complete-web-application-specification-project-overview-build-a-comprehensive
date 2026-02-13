import crypto from "crypto";

// Encryption configuration
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

// Get encryption key from environment or derive from password
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    // For development, derive key from a default secret
    // In production, this should come from environment variables
    return crypto.scryptSync(process.env.ENCRYPTION_SECRET || "development-secret-key", "salt", KEY_LENGTH);
  }
  return crypto.scryptSync(key, "salt", KEY_LENGTH);
}

/**
 * Encrypt a plaintext string
 * @param plaintext - The text to encrypt
 * @returns Encrypted string in format: iv:salt:tag:ciphertext
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return "";

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  // Derive key using scrypt
  const derivedKey = crypto.scryptSync(key.toString("base64"), salt.toString("base64"), KEY_LENGTH, {
    N: 2 ** 14,
    r: 8,
    p: 1,
  });

  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  
  const tag = cipher.getAuthTag();

  // Combine all parts
  const result = Buffer.concat([iv, salt, tag, encrypted]);
  return result.toString("base64");
}

/**
 * Decrypt an encrypted string
 * @param encryptedText - The encrypted string in format: iv:salt:tag:ciphertext
 * @returns Decrypted plaintext string
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return "";

  try {
    const result = Buffer.from(encryptedText, "base64");
    
    // Extract parts
    const iv = result.subarray(0, IV_LENGTH);
    const salt = result.subarray(IV_LENGTH, IV_LENGTH + SALT_LENGTH);
    const tag = result.subarray(IV_LENGTH + SALT_LENGTH, IV_LENGTH + SALT_LENGTH + TAG_LENGTH);
    const ciphertext = result.subarray(IV_LENGTH + SALT_LENGTH + TAG_LENGTH);

    const key = getEncryptionKey();
    const derivedKey = crypto.scryptSync(key.toString("base64"), salt.toString("base64"), KEY_LENGTH, {
      N: 2 ** 14,
      r: 8,
      p: 1,
    });

    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Hash a value using SHA-256 (one-way, for comparison)
 * @param value - The value to hash
 * @returns Hashed string
 */
export function hash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Generate a secure random token
 * @param length - Length of the token in bytes (default 32)
 * @returns Random token as hex string
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Compare a plaintext value with a hash
 * @param plaintext - The plaintext value
 * @param hash - The hash to compare against
 * @returns True if they match
 */
export function compareHash(plaintext: string, hashValue: string): boolean {
  return hash(plaintext) === hashValue;
}

/**
 * Encrypt sensitive fields in an object
 * @param obj - Object containing sensitive data
 * @param fields - Array of field names to encrypt
 * @returns Object with encrypted fields
 */
export function encryptFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const result = { ...obj };
  
  for (const field of fields) {
    if (result[field] && typeof result[field] === "string") {
      (result[field] as string) = encrypt(result[field] as string);
    }
  }
  
  return result;
}

/**
 * Decrypt sensitive fields in an object
 * @param obj - Object containing encrypted data
 * @param fields - Array of field names to decrypt
 * @returns Object with decrypted fields
 */
export function decryptFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const result = { ...obj };
  
  for (const field of fields) {
    if (result[field] && typeof result[field] === "string") {
      try {
        (result[field] as string) = decrypt(result[field] as string);
      } catch {
        // Field might not be encrypted, leave as is
      }
    }
  }
  
  return result;
}

// Fields that should be encrypted in the database
export const ENCRYPTED_FIELDS = {
  users: ["passwordHash"] as const,
  vendors: ["paymentDetails", "taxId"] as const,
  customers: ["notes"] as const,
  transactions: ["notes", "reference"] as const,
  integrationCredentials: ["credentials"] as const,
} as const;

// Helper type for encrypted field names
export type EncryptedFields = typeof ENCRYPTED_FIELDS;
