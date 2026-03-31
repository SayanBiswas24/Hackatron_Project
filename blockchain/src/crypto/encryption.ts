import crypto from 'crypto';

// In production, MUST use a secure 32-byte key from environment variables!
const ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY_HEX; 
const ENCRYPTION_KEY = ENCRYPTION_KEY_HEX 
  ? Buffer.from(ENCRYPTION_KEY_HEX, 'hex') 
  : crypto.randomBytes(32); // ONLY FOR DEV: DO NOT USE RANDOM IN PROD!

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

export interface EncryptedKeyPayload {
    iv: string;
    authTag: string;
    encryptedData: string;
}

/**
 * Encrypts a raw Algorand Secret Key (Uint8Array) using AES-256-GCM.
 */
export function encryptSecretKey(secretKey: Uint8Array): EncryptedKeyPayload {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(Buffer.from(secretKey));
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return {
        iv: iv.toString('hex'),
        authTag: cipher.getAuthTag().toString('hex'),
        encryptedData: encrypted.toString('hex')
    };
}

/**
 * Decrypts the stored payload back into a Uint8Array Secret Key for signing transactions.
 */
export function decryptSecretKey(payload: EncryptedKeyPayload): Uint8Array {
    const iv = Buffer.from(payload.iv, 'hex');
    const authTag = Buffer.from(payload.authTag, 'hex');
    const encryptedData = Buffer.from(payload.encryptedData, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return new Uint8Array(decrypted);
}
