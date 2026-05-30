"use client";

import { Suspense } from "react";
import { RegisterView } from "@/components/auth/register-view";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-blue-900">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
        </div>
      }
    >
      <RegisterView />
    </Suspense>
  );
}
