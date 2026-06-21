"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { ReactNode } from "react";

/** refetchInterval: إعادة التحقق من الجلسة — توازن بين الأمان وسرعة الصفحة */
const SESSION_REFETCH_INTERVAL = 30;

export function SessionProvider({ children }: { children: ReactNode }) {
  return (
    <NextAuthSessionProvider refetchInterval={SESSION_REFETCH_INTERVAL}>
      {children}
    </NextAuthSessionProvider>
  );
}
