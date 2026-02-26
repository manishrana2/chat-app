"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AuthProvider } from "@/hooks/useAuth";
import { ErrorBoundary, ErrorLogger } from "@/components/ErrorBoundary";
import { ReactNode } from "react";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL!
);

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ConvexProvider client={convex}>
        <AuthProvider>
          <ErrorLogger />
          {children}
        </AuthProvider>
      </ConvexProvider>
    </ErrorBoundary>
  );
}