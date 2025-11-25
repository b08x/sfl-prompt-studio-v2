/**
 * Secure Storage Utility
 *
 * Provides secure storage for sensitive data like API keys using:
 * - sessionStorage (default): Keys cleared when tab closes
 * - Encrypted localStorage: Optional persistent storage using Web Crypto API
 *
 * Security features:
 * - AES-GCM encryption for localStorage
 * - Session-only storage by default
 * - Automatic migration from plaintext localStorage
 */

export type StorageMode = 'session' | 'encrypted-persistent';

interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
}

/**
 * Derives an encryption key from a password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generates a device-specific encryption password
 * This uses a combination of browser characteristics as a weak password
 * Note: This provides obfuscation but not true security against determined attackers
 */
function getDevicePassword(): string {
  const factors = [
    navigator.userAgent,
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    new Date().getTimezoneOffset().toString()
  ];

  return factors.join('|');
}

/**
 * Encrypts data using AES-GCM
 */
async function encrypt(data: string): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Derive encryption key
  const password = getDevicePassword();
  const key = await deriveKey(password, salt);

  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    dataBuffer
  );

  // Convert to base64 for storage
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt))
  };
}

/**
 * Decrypts data using AES-GCM
 */
async function decrypt(encryptedData: EncryptedData): Promise<string> {
  // Convert from base64
  const ciphertext = Uint8Array.from(atob(encryptedData.ciphertext), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
  const salt = Uint8Array.from(atob(encryptedData.salt), c => c.charCodeAt(0));

  // Derive decryption key
  const password = getDevicePassword();
  const key = await deriveKey(password, salt);

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Secure storage class
 */
export class SecureStorage {
  private storageMode: StorageMode;
  private readonly STORAGE_KEY = 'sfl_secure_api_keys';
  private readonly MODE_KEY = 'sfl_storage_mode';
  private readonly LEGACY_KEY = 'sfl_api_keys';

  constructor(mode: StorageMode = 'session') {
    this.storageMode = mode;
    this.initializeMode();
  }

  /**
   * Initialize storage mode from saved preference
   */
  private initializeMode(): void {
    try {
      const savedMode = localStorage.getItem(this.MODE_KEY) as StorageMode;
      if (savedMode === 'session' || savedMode === 'encrypted-persistent') {
        this.storageMode = savedMode;
      }
    } catch (e) {
      console.error('Failed to initialize storage mode:', e);
    }
  }

  /**
   * Get current storage mode
   */
  getMode(): StorageMode {
    return this.storageMode;
  }

  /**
   * Set storage mode and migrate data if needed
   */
  async setMode(mode: StorageMode): Promise<void> {
    if (mode === this.storageMode) return;

    // Get current data
    const currentData = await this.getItem(this.STORAGE_KEY);

    // Update mode
    this.storageMode = mode;
    localStorage.setItem(this.MODE_KEY, mode);

    // Migrate data to new storage
    if (currentData) {
      await this.setItem(this.STORAGE_KEY, currentData);
    }

    // Clear old storage
    if (mode === 'session') {
      localStorage.removeItem(this.STORAGE_KEY);
    } else {
      sessionStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Store an item securely
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.storageMode === 'session') {
        // Use sessionStorage directly
        sessionStorage.setItem(key, value);
      } else {
        // Encrypt and store in localStorage
        const encrypted = await encrypt(value);
        localStorage.setItem(key, JSON.stringify(encrypted));
      }
    } catch (e) {
      console.error('Failed to store item securely:', e);
      throw new Error('Failed to store data securely');
    }
  }

  /**
   * Retrieve an item securely
   */
  async getItem(key: string): Promise<string | null> {
    try {
      if (this.storageMode === 'session') {
        // Read from sessionStorage
        return sessionStorage.getItem(key);
      } else {
        // Read and decrypt from localStorage
        const storedData = localStorage.getItem(key);
        if (!storedData) return null;

        const encrypted = JSON.parse(storedData) as EncryptedData;
        return await decrypt(encrypted);
      }
    } catch (e) {
      console.error('Failed to retrieve item securely:', e);
      return null;
    }
  }

  /**
   * Remove an item
   */
  removeItem(key: string): void {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  }

  /**
   * Clear all secure storage
   */
  clear(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Check if legacy plaintext keys exist
   */
  hasLegacyKeys(): boolean {
    try {
      const legacy = localStorage.getItem(this.LEGACY_KEY);
      return legacy !== null;
    } catch {
      return false;
    }
  }

  /**
   * Migrate from legacy plaintext storage
   */
  async migrateLegacyKeys(): Promise<string | null> {
    try {
      const legacyData = localStorage.getItem(this.LEGACY_KEY);
      if (!legacyData) return null;

      // Store in secure storage
      await this.setItem(this.STORAGE_KEY, legacyData);

      // Clear legacy storage
      localStorage.removeItem(this.LEGACY_KEY);

      console.log('Successfully migrated API keys from plaintext to secure storage');
      return legacyData;
    } catch (e) {
      console.error('Failed to migrate legacy keys:', e);
      throw new Error('Failed to migrate API keys');
    }
  }

  /**
   * Store API keys
   */
  async setApiKeys(keys: Record<string, string>): Promise<void> {
    await this.setItem(this.STORAGE_KEY, JSON.stringify(keys));
  }

  /**
   * Retrieve API keys
   */
  async getApiKeys(): Promise<Record<string, string> | null> {
    const data = await this.getItem(this.STORAGE_KEY);
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Clear API keys
   */
  clearApiKeys(): void {
    this.removeItem(this.STORAGE_KEY);
    // Also clear legacy keys
    localStorage.removeItem(this.LEGACY_KEY);
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage();
