/**
 * Basic encryption hook for future use
 * Currently simplified - messages are stored as plaintext
 */

import { useEffect, useState } from "react";

export function useEncryption() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  return {
    isLoading,
  };
}
