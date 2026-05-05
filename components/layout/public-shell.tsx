"use client";

import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicTopBar } from "@/components/layout/public-top-bar";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { ContactFloatingButton } from "@/components/layout/contact-floating-button";

type PublicShellProps = {
  children: React.ReactNode;
};

export function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicTopBar />
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <WhatsAppButton />
      <ContactFloatingButton />
    </div>
  );
}
