"use client";

import { Suspense } from "react";
import { LoginView } from "@/components/auth/login-view";
import { GlobalLogoLoader } from "@/components/ui/logo-loader";

export default function LoginPage() {
  return (
    <Suspense
      fallback={<GlobalLogoLoader label="Preparing sign in..." />}
    >
      <LoginView />
    </Suspense>
  );
}
