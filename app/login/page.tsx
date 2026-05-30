"use client";

import { Suspense } from "react";
import { LoginView } from "@/components/auth/login-view";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-blue-900">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
        </div>
      }
    >
      <LoginView />
    </Suspense>
  );
}
