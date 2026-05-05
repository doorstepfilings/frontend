import { PublicShell } from "@/components/layout/public-shell";
import { ServiceApplication } from "@/components/services/service-application";

export default function ApplyServicePage() {
  return (
    <PublicShell>
        <section className="bg-slate-50 min-h-screen">
            <ServiceApplication />
        </section>
    </PublicShell>
  );
}
