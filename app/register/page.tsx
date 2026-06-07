"use client";

import { Suspense } from "react";
import { RegisterView } from "@/components/auth/register-view";
import { GlobalLogoLoader } from "@/components/ui/logo-loader";

export default function RegisterPage() {
  return (
    <Suspense fallback={<GlobalLogoLoader label="Preparing registration..." />}>
      <RegisterView />
    </Suspense>
  );
}
