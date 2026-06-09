import Image from "next/image";
import Link from "next/link";
import { homeHeroAvatars } from "@/lib/constants/testimonials";

const STAR_PATHS = Array.from({ length: 5 }, (_, i) => i + 1);

function StarRating() {
  return (
    <div className="mb-1 flex items-center gap-1">
      {STAR_PATHS.map((star) => (
        <svg key={star} className="h-5 w-5 fill-current text-amber-400" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-2 font-semibold text-white">4.9/5</span>
    </div>
  );
}

export function HomeHero() {
  return (
    <section className="relative flex min-h-[calc(100dvh-4rem)] items-center overflow-hidden bg-slate-950 lg:min-h-screen">
      {/* Background layers */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="animate-blob absolute -left-48 top-1/4 h-[420px] w-[420px] rounded-full bg-blue-600/20 blur-[100px] sm:-left-32 sm:h-[600px] sm:w-[600px] sm:blur-[120px]" />
        <div className="animate-blob delay-500 absolute -right-48 bottom-1/4 h-[360px] w-[360px] rounded-full bg-amber-500/15 blur-[90px] sm:-right-32 sm:h-[500px] sm:w-[500px] sm:blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[120px] sm:h-[800px] sm:w-[800px] sm:blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(251,191,36,0.03) 35px, rgba(251,191,36,0.03) 70px)",
          }}
        />
      </div>

      <div className="container relative z-20 mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-20">
          {/* Left copy */}
          <div className="w-full text-left lg:w-[55%]">
            {/* Badge */}
            <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Building India&apos;s Business Backbone
              </span>
            </div>

            <h1 className="animate-fade-in-up delay-100 mb-6 text-4xl leading-[1.1] font-bold text-white sm:text-5xl lg:text-6xl xl:text-7xl">
              Start. Run. Grow.
              <span className="text-gradient-animated mt-2 block bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                We Handle the Rest.
              </span>
            </h1>

            <p className="animate-fade-in-up delay-200 mb-8 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl">
              From company registration to ongoing compliance, we take care of
              everything - seamlessly online and right at your doorstep.
            </p>

            {/* CTA buttons */}
            <div className="animate-fade-in-up delay-300 mb-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-4 text-center text-base font-semibold text-white shadow-lg shadow-amber-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-amber-500/40 sm:w-auto sm:px-8 sm:text-lg"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Free Consultation
                  <svg
                    className="h-5 w-5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-700 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>

              <Link
                href="/about"
                className="group flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-white/5 px-5 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-slate-600 hover:bg-white/10 sm:w-auto sm:px-8 sm:text-lg"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 transition-colors group-hover:bg-amber-500/30">
                  <svg
                    className="ml-0.5 h-4 w-4 text-amber-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                Watch Our Story
              </Link>
            </div>

            {/* Social proof */}
            <div className="animate-fade-in-up delay-400 flex flex-col items-start gap-6 border-t border-slate-800/50 pt-8 sm:flex-row sm:items-center">
              <div className="-space-x-3 flex">
                {homeHeroAvatars.map((avatar) => (
                  <Image
                    key={avatar.src}
                    src={avatar.src}
                    alt={avatar.alt}
                    width={52}
                    height={52}
                    sizes="52px"
                    quality={100}
                    style={{ objectPosition: avatar.imagePosition }}
                    className="h-[52px] w-[52px] rounded-full border-2 border-slate-950 bg-slate-200 object-cover transition-transform hover:z-10 hover:scale-110"
                  />
                ))}
              </div>
              <div>
                <StarRating />
                <p className="text-sm text-slate-500">
                  Trusted by 500+ businesses across India
                </p>
              </div>
            </div>
          </div>

          {/* Right image card */}
          <div className="relative hidden w-full lg:block lg:w-[45%]">
            <div className="relative">
              <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-r from-amber-500/30 via-amber-600/20 to-blue-600/20 blur-3xl" />

              <div className="relative overflow-hidden rounded-3xl border border-slate-700/50 shadow-2xl">
                <Image
                  src="/assets/images/home-hero.jpg"
                  alt="Professional financial consultation"
                  width={900}
                  height={500}
                  priority
                  className="h-[500px] w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 to-transparent" />

                {/* Stats overlay */}
                <div className="absolute right-0 bottom-0 left-0 p-8">
                  <div className="glass-dark rounded-2xl p-6 backdrop-blur-md">
                    <div className="mb-4 flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg">
                        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Revenue Managed</p>
                        <p className="text-2xl font-bold text-white">Rs.500+ Crores</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-400">GST</span>
                      <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-500">Finance</span>
                      <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-400">Advisory</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="animate-float absolute -top-6 -right-6 rounded-2xl bg-white p-5 shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-500">Success Rate</p>
                    <p className="text-2xl font-bold text-gray-900">99%</p>
                  </div>
                </div>
              </div>

              <div className="animate-float-delayed absolute -bottom-4 -left-6 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-5 text-white shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-white/80">Experience</p>
                    <p className="text-2xl font-bold">11+ Years</p>
                  </div>
                </div>
              </div>

              <div className="absolute top-1/2 -right-12 h-24 w-24 rounded-full bg-amber-500/20 blur-2xl" />
              <div className="absolute bottom-1/4 -left-8 h-20 w-20 rounded-full bg-blue-500/20 blur-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 animate-bounce lg:flex">
        <span className="text-xs uppercase tracking-widest text-slate-500">Scroll</span>
        <div className="flex h-10 w-6 justify-center rounded-full border-2 border-slate-600 p-1">
          <div className="h-3 w-1.5 animate-pulse rounded-full bg-amber-500" />
        </div>
      </div>
    </section>
  );
}
