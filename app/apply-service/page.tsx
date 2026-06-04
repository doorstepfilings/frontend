import { PublicShell } from "@/components/layout/public-shell";
import { ServiceApplication } from "@/components/services/service-application";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function ApplyServicePage() {
  return (
    <AuthGuard allowedRoles={["user", "client"]}>
      <PublicShell>
          <section className="bg-slate-50 min-h-screen">
              <ServiceApplication />
          </section>
      </PublicShell>
    </AuthGuard>
  );
}

