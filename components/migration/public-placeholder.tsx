import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";

type PublicPlaceholderProps = {
  badge: string;
  title: string;
  description: string;
  sourcePath: string;
  nextSteps: string[];
};

export function PublicPlaceholder({
  badge,
  title,
  description,
  sourcePath,
  nextSteps,
}: PublicPlaceholderProps) {
  return (
    <PublicShell>
      <section className="bg-slate-950 text-white">
        <div className="container mx-auto px-4 py-16">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-300">
            {badge}
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
            {description}
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">
              Migration Source
            </p>
            <h2 className="mt-3 text-2xl font-black text-slate-900">
              Original React implementation still lives in the Laravel frontend.
            </h2>
            <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 font-mono text-sm text-slate-700">
              {sourcePath}
            </p>
            <p className="mt-5 text-sm leading-7 text-slate-600">
              This route now exists in Next.js, but the full screen logic and supporting
              APIs still need to be ported before the Laravel code can be removed safely.
            </p>
          </div>

          <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">
              Next Steps
            </p>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-amber-900">
              {nextSteps.map((step) => (
                <li key={step} className="flex gap-3">
                  <i className="fas fa-arrow-right mt-1 text-amber-500" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-blue-800"
              >
                Services
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-amber-900 transition hover:bg-white"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
