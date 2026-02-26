/**
 * End-to-End Encryption using Web Crypto API (AES-GCM)
 * Provides deterministic key derivation from conversation IDs
 */

/**
 * Derive a shared secret from conversation ID using PBKDF2
 */
export async function deriveKeyFromConversation(conversationId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(conversationId),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: encoder.encode("chat-app-e2e-2024"),
      iterations: 100000,
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  return key;
}

/**
 * Encrypt a message using AES-GCM
 */
export async function encryptMessage(
  text: string,
  key: CryptoKey
): Promise<{ iv: string; ciphertext: string }> {
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(text);

  // Generate random 96-bit IV for GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext
  );

  // Convert to base64 for transmission/storage
  return {
    iv: btoa(String.fromCharCode(...iv)),
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
  };
}

/**
 * Decrypt a message using AES-GCM
 */
export async function decryptMessage(
  iv: string,
  ciphertext: string,
  key: CryptoKey
): Promise<string> {
  const decoder = new TextDecoder();

  // Convert from base64
  const ivBytes = new Uint8Array(
    atob(iv)
      .split("")
      .map((c) => c.charCodeAt(0))
  );
  const ciphertextBytes = new Uint8Array(
    atob(ciphertext)
      .split("")
      .map((c) => c.charCodeAt(0))
  );

  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBytes },
      key,
      ciphertextBytes
    );

    return decoder.decode(plaintext);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt message");
  }
}

/**
 * Generate a random string for tokens
 */
export function generateRandomToken(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Hash a string using SHA256
 */
export async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Setup encryption (placeholder for initialization)
 */
export async function setupEncryption(): Promise<void> {
  // No-op for now; Web Crypto API is available globally
}
