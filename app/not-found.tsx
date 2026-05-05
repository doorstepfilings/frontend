import Link from "next/link";
import { CONTACT, QUICK_SERVICES, SITE } from "@/lib/constants/site";

const primaryActions = [
  {
    href: "/",
    label: "Back to Home",
    icon: "fa-house",
    className:
      "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 hover:-translate-y-0.5 hover:shadow-amber-500/40",
  },
  {
    href: "/services",
    label: "Explore Services",
    icon: "fa-briefcase",
    className:
      "border border-white/15 bg-white/10 text-white backdrop-blur-sm hover:border-white/25 hover:bg-white/15",
  },
];

const quickLinks = [
  {
    href: "/about",
    title: "About Us",
    icon: "fa-building-columns",
    description: "Learn more about DoorstepFilings and how we support businesses.",
  },
  {
    href: "/contact",
    title: "Talk to an Expert",
    icon: "fa-headset",
    description: "Reach our team for help with registration, compliance, or filings.",
  },
  {
    href: "/services",
    title: "Browse Services",
    icon: "fa-file-signature",
    description: "Jump into GST, tax, company registration, and advisory services.",
  },
];

export default function NotFound() {
  return (
    <div className="bg-slate-50">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
          <div className="absolute -left-28 top-16 h-72 w-72 rounded-full bg-blue-600/20 blur-[120px]" />
          <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-amber-500/20 blur-[140px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <div className="container relative mx-auto px-4 py-20 lg:py-28">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-300">
                  404 Page Not Found
                </span>
              </div>

              <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-7xl">
                This page took a wrong turn.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
                The page you requested does not exist or may have been moved. Let&apos;s
                get you back to the right place and keep your business work moving.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                {primaryActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={`inline-flex items-center justify-center gap-3 rounded-2xl px-7 py-4 text-sm font-black transition-all duration-300 ${action.className}`}
                  >
                    <i className={`fas ${action.icon} text-sm`} />
                    {action.label}
                  </Link>
                ))}
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                    Trusted Since
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">{SITE.established}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                    Quick Support
                  </p>
                  <p className="mt-2 text-sm font-bold text-white">{CONTACT.phoneAlt}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                    Need Help
                  </p>
                  <p className="mt-2 text-sm font-bold text-white">{CONTACT.email}</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-amber-500/20 via-blue-500/10 to-transparent blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.08] p-8 shadow-2xl backdrop-blur-md">
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-400/15 blur-3xl" />
                <div className="absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-blue-500/15 blur-3xl" />

                <div className="relative rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-8">
                  <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">
                    Missing Destination
                  </p>
                  <div className="mt-4 flex items-end gap-3">
                    <span className="text-7xl font-black leading-none text-white sm:text-8xl">
                      404
                    </span>
                    <span className="mb-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
                      Not Found
                    </span>
                  </div>
                  <p className="mt-5 text-sm leading-relaxed text-slate-300">
                    Try one of the service paths below or connect with our team for
                    direct assistance.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {QUICK_SERVICES.slice(0, 4).map((service) => (
                      <span
                        key={service.name}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200"
                      >
                        <i className={`fas ${service.icon} text-amber-400`} />
                        {service.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="relative mt-6 rounded-[1.5rem] border border-blue-100/10 bg-white px-5 py-4 text-slate-900 shadow-xl">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-900 text-white shadow-lg shadow-blue-900/20">
                      <i className="fas fa-compass" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-blue-900">{SITE.name}</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500">
                        Back on track with registrations, tax support, and compliance
                        services in one place.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <div className="mb-8">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-600">
                Helpful Routes
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                Here are a few better places to go next.
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-900/20 hover:shadow-xl"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 transition-all duration-300 group-hover:bg-blue-900 group-hover:text-white">
                    <i className={`fas ${link.icon}`} />
                  </div>
                  <h3 className="mt-5 text-xl font-black text-slate-900 transition-colors group-hover:text-blue-900">
                    {link.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500">
                    {link.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-900">
                    Visit page
                    <i className="fas fa-arrow-right text-xs transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-gradient-to-br from-blue-900 to-slate-950 p-8 text-white shadow-2xl shadow-blue-900/15">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-amber-300">
              Need Immediate Help?
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-tight">
              Speak with our support team.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-blue-100">
              If you were looking for a specific filing or compliance page, we can
              point you to the correct route quickly.
            </p>

            <div className="mt-8 space-y-4">
              <a
                href={`tel:${CONTACT.phoneAlt.replace(/\s/g, "")}`}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-4 transition-colors hover:bg-white/15"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white">
                  <i className="fas fa-phone-alt" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
                    Call Us
                  </p>
                  <p className="text-sm font-bold text-white">{CONTACT.phoneAlt}</p>
                </div>
              </a>

              <a
                href={`mailto:${CONTACT.email}`}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-4 transition-colors hover:bg-white/15"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white">
                  <i className="fas fa-envelope" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
                    Email Support
                  </p>
                  <p className="text-sm font-bold text-white">{CONTACT.email}</p>
                </div>
              </a>
            </div>

            <Link
              href="/contact"
              className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-white px-6 py-4 text-sm font-black text-blue-900 transition-all hover:-translate-y-0.5 hover:bg-amber-400 hover:text-slate-950"
            >
              Open Contact Page
              <i className="fas fa-arrow-up-right-from-square text-xs" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
