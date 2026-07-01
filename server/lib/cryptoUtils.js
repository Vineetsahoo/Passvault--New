import crypto from 'crypto';

// Ported directly from the old Password.js Mongoose methods (encryptPassword /
// decryptPassword / calculatePasswordStrength) so the encryption behavior is
// IDENTICAL to before — only where it lives has changed. Same algorithm, same
// AAD-binds-ciphertext-to-owner approach, same env var.

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key';
const ALGORITHM = 'aes-256-gcm';

const getEncryptionKey = () => {
  if (Buffer.from(ENCRYPTION_KEY).length === 32) {
    return Buffer.from(ENCRYPTION_KEY);
  }
  return crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
};

/**
 * Encrypts a plaintext string, binding it to ownerId via AES-256-GCM's AAD
 * so a ciphertext can't be decrypted under a different owner's context.
 * Returns "iv:authTag:ciphertext" (all hex), same format as before.
 */
export const encrypt = (plainText, ownerId) => {
  try {
    const iv = crypto.randomBytes(16);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from(String(ownerId)));

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Reverses encrypt(). ownerId must match what was passed at encryption time.
 */
export const decrypt = (encryptedValue, ownerId) => {
  try {
    if (!encryptedValue) {
      throw new Error('No encrypted value provided');
    }

    const parts = encryptedValue.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted value format');
    }

    const [ivHex, authTagHex, ciphertext] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from(String(ownerId)));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Same scoring logic as the old passwordSchema.methods.calculatePasswordStrength.
 */
export const calculatePasswordStrength = (password) => {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (!/(.)\1{2,}/.test(password)) score += 1;
  if (!/123|abc|qwe/i.test(password)) score += 1;

  if (score >= 8) return 'very-strong';
  if (score >= 6) return 'strong';
  if (score >= 4) return 'medium';
  return 'weak';
};
