/**
 * Basic Cryptographic Utilities
 * Simplified - currently using plaintext messaging
 */

/**
 * Placeholder for future encryption needs
 */
export async function setupEncryption(): Promise<void> {
  // Placeholder for future E2E setup
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
 * Hash a string (basic SHA256 simulation)
 * For production, use crypto libraries
 */
export async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
