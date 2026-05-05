import { AuthGuard } from "@/components/auth/auth-guard";
import { RoleShell } from "@/components/layout/role-shell";

type ProtectedPlaceholderProps = {
  title: string;
  subtitle: string;
  sourcePath: string;
  nextSteps: string[];
  allowedRoles?: string[];
  embedded?: boolean;
  theme?: "default" | "admin";
};

export function ProtectedPlaceholder({
  title,
  subtitle,
  sourcePath,
  nextSteps,
  allowedRoles,
  embedded = false,
  theme = "default",
}: ProtectedPlaceholderProps) {
  const content = (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">
          Original Source
        </p>
        <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 font-mono text-sm text-slate-700">
          {sourcePath}
        </p>
        <p className="mt-5 text-sm leading-7 text-slate-600">
          This protected route is now present in the Next.js app shell, but the full
          business logic, data mutations, and detail UI still need to be ported before
          the Laravel implementation can be deleted.
        </p>
      </div>

      <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">
          Migration Work Remaining
        </p>
        <ul className="mt-5 space-y-3 text-sm leading-7 text-amber-900">
          {nextSteps.map((step) => (
            <li key={step} className="flex gap-3">
              <i className="fas fa-arrow-right mt-1 text-amber-500" />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <AuthGuard allowedRoles={allowedRoles}>
      {embedded ? (
        content
      ) : (
        <RoleShell title={title} subtitle={subtitle} theme={theme}>
          {content}
        </RoleShell>
      )}
    </AuthGuard>
  );
}
