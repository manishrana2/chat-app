/**
 * E2E Encryption Hook using Web Crypto API
 * Provides encrypt/decrypt functions with automatic key caching
 */

import { useEffect, useState, useRef } from "react";
import { deriveKeyFromConversation, encryptMessage as cryptoEncrypt, decryptMessage as cryptoDecrypt } from "@/lib/crypto";

interface EncryptionResult {
  iv: string;
  ciphertext: string;
}

export function useEncryption() {
  const [isLoading, setIsLoading] = useState(true);
  const keyCacheRef = useRef<Map<string, CryptoKey>>(new Map());

  useEffect(() => {
    setIsLoading(false);
  }, []);

  /**
   * Get or derive shared secret for a conversation
   */
  const getOrCreateSharedSecret = async (conversationId: string): Promise<CryptoKey> => {
    if (keyCacheRef.current.has(conversationId)) {
      return keyCacheRef.current.get(conversationId)!;
    }

    try {
      const key = await deriveKeyFromConversation(conversationId);
      keyCacheRef.current.set(conversationId, key);
      return key;
    } catch (error) {
      console.error("Failed to derive key:", error);
      throw error;
    }
  };

  /**
   * Encrypt a message
   */
  const encryptMessage = async (
    text: string,
    conversationId: string
  ): Promise<EncryptionResult> => {
    try {
      const key = await getOrCreateSharedSecret(conversationId);
      const result = await cryptoEncrypt(text, key);
      return result;
    } catch (error) {
      console.error("Encryption failed:", error);
      throw error;
    }
  };

  /**
   * Decrypt a message
   */
  const decryptMessage = async (
    iv: string,
    ciphertext: string,
    conversationId: string
  ): Promise<string> => {
    try {
      const key = await getOrCreateSharedSecret(conversationId);
      const plaintext = await cryptoDecrypt(iv, ciphertext, key);
      return plaintext;
    } catch (error) {
      console.error("Decryption failed:", error);
      throw error;
    }
  };

  return {
    encryptMessage,
    decryptMessage,
    getOrCreateSharedSecret,
    isLoading,
  };
}
