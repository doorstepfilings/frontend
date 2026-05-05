"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { TestimonialSlider } from "@/components/ui/testimonial-slider";
import { fetchServices } from "@/lib/features/services/services-slice";
import type { ServiceCategory, ServiceItem } from "@/lib/features/services/types";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { PublicShell } from "@/components/layout/public-shell";

const stats = [
  { number: 500, suffix: "+", label: "Happy Clients" },
  { number: 15, suffix: "+", label: "Years Experience" },
  { number: 1000, suffix: "+", label: "Projects Completed" },
  { number: 50, suffix: "+", label: "Expert Team" },
];

const heroAvatars = [
  {
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    alt: "Client portrait 1",
  },
  {
    src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    alt: "Client portrait 2",
  },
  {
    src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    alt: "Client portrait 3",
  },
  {
    src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80",
    alt: "Client portrait 4",
  },
];

const testimonials = [
  {
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    name: "Rajesh Patel",
    designation: "CEO, Patel Enterprises",
    quote:
      "Our Firm has been instrumental in our company's growth. Their GST and tax planning expertise saved us significant time and money. Highly recommended!",
  },
  {
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    name: "Priya Sharma",
    designation: "Director, Sharma & Co.",
    quote:
      "Professional, responsive, and knowledgeable. They handled our company registration and compliance with utmost care. A trusted partner for our business.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80",
    name: "Amit Gupta",
    designation: "Founder, TechStart India",
    quote:
      "Excellent service! They helped us secure government subsidies and project finance. Their expertise in MSME schemes is unparalleled.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    name: "Suresh Mehta",
    designation: "Managing Director, Mehta Industries",
    quote:
      "Outstanding financial advisory services! Their team guided us through complex tax regulations and helped optimize our business structure.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
    name: "Sunita Reddy",
    designation: "Managing Partner, SR Associates",
    quote:
      "Exceptional service and attention to detail. They made our compliance process smooth and hassle-free. Truly a reliable partner for any business.",
  },
];

function Counter({ target }: { target: number }) {
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = counterRef.current;

    if (!element) {
      return;
    }

    let frameId = 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }

        const duration = 2000;
        const startTime = performance.now();

        const updateCount = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = progress * (2 - progress);
          const currentCount = Math.floor(easedProgress * target);

          if (counterRef.current) {
            counterRef.current.innerText = String(currentCount);
          }

          if (progress < 1) {
            frameId = window.requestAnimationFrame(updateCount);
            return;
          }

          if (counterRef.current) {
            counterRef.current.innerText = String(target);
          }
        };

        frameId = window.requestAnimationFrame(updateCount);
        observer.disconnect();
      },
      { threshold: 0.1 },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameId);
    };
  }, [target]);

  return <span ref={counterRef}>0</span>;
}

function getServiceHref(service: ServiceItem) {
  return service.link || `/service/${service.slug}`;
}

export default function HomePage() {
  const dispatch = useAppDispatch();
  const { items: servicesData, status } = useAppSelector((state) => state.services);
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    if (status === "idle" && servicesData.length === 0) {
      dispatch(fetchServices());
    }
  }, [dispatch, servicesData.length, status]);

  const selectedTab = activeTab || servicesData[0]?.slug || "";

  const activeCategory: ServiceCategory | undefined =
    servicesData.find((category) => category.slug === selectedTab) || servicesData[0];

  return (
    <PublicShell>
      <div className="font-sans text-gray-800">
        <section className="relative flex min-h-screen items-center overflow-hidden bg-slate-950">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
            <div className="animate-blob absolute -left-32 top-1/4 h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[120px]"></div>
            <div className="animate-blob delay-500 absolute -right-32 bottom-1/4 h-[500px] w-[500px] rounded-full bg-amber-500/15 blur-[100px]"></div>
            <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[150px]"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background:
                  "repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(251,191,36,0.03) 35px, rgba(251,191,36,0.03) 70px)",
              }}
            ></div>
          </div>

          <div className="container relative z-20 mx-auto px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
            <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-20">
              <div className="w-full text-left lg:w-[55%]">
                <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
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

                <div className="animate-fade-in-up delay-300 mb-10 flex flex-wrap gap-4">
                  <Link
                    href="/contact"
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-amber-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-amber-500/40"
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
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-700 opacity-0 transition-opacity group-hover:opacity-100"></div>
                  </Link>
                  <Link
                    href="/about"
                    className="group flex items-center gap-3 rounded-xl border border-slate-700 bg-white/5 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-slate-600 hover:bg-white/10"
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

                <div className="animate-fade-in-up delay-400 flex flex-col items-start gap-6 border-t border-slate-800/50 pt-8 sm:flex-row sm:items-center">
                  <div className="-space-x-3 flex">
                    {heroAvatars.map((avatar) => (
                      <Image
                        key={avatar.src}
                        src={avatar.src}
                        alt={avatar.alt}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full border-2 border-slate-950 object-cover transition-transform hover:z-10 hover:scale-110"
                      />
                    ))}
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-slate-950 bg-amber-50 text-xs font-bold text-white transition-transform hover:scale-110">
                      500+
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className="h-5 w-5 fill-current text-amber-400"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-2 font-semibold text-white">4.9/5</span>
                    </div>
                    <p className="text-sm text-slate-500">
                      Trusted by 500+ businesses across India
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative hidden w-full lg:block lg:w-[45%]">
                <div className="relative">
                  <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-r from-amber-500/30 via-amber-600/20 to-blue-600/20 blur-3xl"></div>

                  <div className="relative overflow-hidden rounded-3xl border border-slate-700/50 shadow-2xl">
                    <Image
                      src="/assets/images/home-hero.jpg"
                      alt="Professional financial consultation"
                      width={900}
                      height={500}
                      priority
                      className="h-[500px] w-full object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 to-transparent"></div>

                    <div className="absolute right-0 bottom-0 left-0 p-8">
                      <div className="glass-dark rounded-2xl p-6 backdrop-blur-md">
                        <div className="mb-4 flex items-center gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg">
                            <svg
                              className="h-7 w-7"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
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
                          <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-400">
                            GST
                          </span>
                          <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-500">
                            Finance
                          </span>
                          <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-400">
                            Advisory
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="animate-float absolute -top-6 -right-6 rounded-2xl bg-white p-5 shadow-2xl">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <svg
                          className="h-6 w-6 text-green-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-gray-500">
                          Success Rate
                        </p>
                        <p className="text-2xl font-bold text-gray-900">99.9%</p>
                      </div>
                    </div>
                  </div>

                  <div className="animate-float-delayed absolute -bottom-4 -left-6 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 p-5 text-white shadow-2xl">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                        <svg
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-white/80">
                          Experience
                        </p>
                        <p className="text-2xl font-bold">15+ Years</p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-1/2 -right-12 h-24 w-24 rounded-full bg-amber-500/20 blur-2xl"></div>
                  <div className="absolute bottom-1/4 -left-8 h-20 w-20 rounded-full bg-blue-500/20 blur-xl"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 animate-bounce lg:flex">
            <span className="text-xs uppercase tracking-widest text-slate-500">
              Scroll
            </span>
            <div className="flex h-10 w-6 justify-center rounded-full border-2 border-slate-600 p-1">
              <div className="h-3 w-1.5 animate-pulse rounded-full bg-amber-500"></div>
            </div>
          </div>
        </section>

        <section className="border-b border-gray-100 bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="group text-center">
                  <h3 className="mb-2 text-4xl font-extrabold text-gray-900 transition-colors group-hover:text-amber-500 md:text-5xl">
                    <Counter target={stat.number} />
                    {stat.suffix}
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <h2 className="mb-6 text-4xl font-bold text-gray-900">
                Our Core Services
              </h2>
              <p className="text-xl text-gray-600">
                Comprehensive financial, legal, and compliance solutions for your
                business.
              </p>
            </div>

            <div className="flex flex-col gap-8 lg:flex-row">
              <div className="w-full lg:w-1/3">
                <div className="flex flex-col space-y-2">
                  {Array.isArray(servicesData) &&
                    servicesData.map((tab) => (
                      <button
                        key={tab.slug || tab.id || tab.category}
                        onClick={() => setActiveTab(tab.slug || "")}
                          className={`rounded-r-lg border-l-4 p-4 text-left transition-all duration-300 ${
                          selectedTab === tab.slug
                            ? "border-amber-500 bg-blue-900 text-white shadow-xl"
                            : "border-transparent bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                              selectedTab === tab.slug ? "bg-white/20" : "bg-gray-100"
                            }`}
                          >
                            <i
                              className={`fas ${tab.icon || "fa-layer-group"} text-lg ${
                                selectedTab === tab.slug ? "text-white" : "text-gray-500"
                              }`}
                            ></i>
                          </div>
                          <div>
                            <h4 className="text-lg font-bold">{tab.category}</h4>
                            <p
                              className={`text-xs ${
                                selectedTab === tab.slug ? "text-blue-200" : "text-gray-500"
                              }`}
                            >
                              Explore Services
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              <div className="w-full lg:w-2/3">
                {activeCategory ? (
                  <div className="animate-fade-in grid grid-cols-1 gap-6 md:grid-cols-2">
                    {activeCategory.services.map((service) => (
                      <div
                        key={service.id}
                        className="group rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg"
                      >
                        <div className="mb-4 flex items-start justify-between gap-4">
                          <div className="flex items-center">
                            <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-amber-50 shadow-sm transition-colors group-hover:bg-amber-500">
                              <i
                                className={`fas ${activeCategory.icon || "fa-layer-group"} text-amber-500 group-hover:text-white`}
                              ></i>
                            </div>
                            <h3 className="ml-4 text-lg font-bold text-gray-900 transition-colors group-hover:text-blue-900">
                              <Link href={getServiceHref(service)}>{service.name}</Link>
                            </h3>
                          </div>
                          {service.price ? (
                            <div className="text-right">
                              <div className="text-lg font-bold text-amber-600">
                                Rs.{Math.round(Number(service.price)).toLocaleString("en-IN")}
                              </div>
                              <div className="text-xs text-gray-400">
                                + GST | Govt. fee extra
                              </div>
                            </div>
                          ) : null}
                        </div>
                        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-gray-600">
                          {service.short_description ||
                            `Expert ${service.name} services for your business compliance.`}
                        </p>
                        <Link
                          href={getServiceHref(service)}
                          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-all group-hover:bg-blue-900 group-hover:text-white"
                          aria-label={`View ${service.name}`}
                        >
                          <i className="fas fa-chevron-right"></i>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
                    {status === "loading"
                      ? "Loading services..."
                      : "Services will appear here once the catalog is ready."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-blue-900 py-20 text-white">
          <div className="absolute top-0 right-0 h-full w-1/2 origin-top-right skew-x-12 bg-white/5"></div>
          <div className="container relative z-10 mx-auto px-4">
            <div className="flex flex-col items-center gap-12 lg:flex-row">
              <div className="lg:w-1/2">
                <h2 className="mb-6 text-3xl font-bold md:text-4xl">
                  Partnering for Your Success
                </h2>
                <p className="mb-8 text-lg leading-relaxed text-blue-200">
                  We do not just balance books; we build businesses. Our proactive
                  approach ensures you are always ahead of regulatory changes and
                  market shifts.
                </p>
                <ul className="mb-8 space-y-4">
                  {[
                    "Data-Driven Financial Advice",
                    "Risk Mitigation & Compliance",
                    "Strategic Growth Planning",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-xs text-white">
                        <i className="fas fa-check"></i>
                      </div>
                      <span className="text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl bg-white p-8 text-gray-800 shadow-2xl lg:w-1/2">
                <h3 className="mb-6 text-2xl font-bold">Request a Consultation</h3>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                        First Name
                      </label>
                      <input
                        type="text"
                        className="w-full rounded border border-gray-200 bg-gray-50 px-4 py-3 focus:border-blue-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                        Last Name
                      </label>
                      <input
                        type="text"
                        className="w-full rounded border border-gray-200 bg-gray-50 px-4 py-3 focus:border-blue-900 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full rounded border border-gray-200 bg-gray-50 px-4 py-3 focus:border-blue-900 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    className="w-full rounded bg-amber-500 py-4 text-lg font-bold text-white transition-colors hover:bg-amber-600"
                  >
                    Submit Request
                  </button>
                  <p className="mt-4 text-center text-xs text-gray-400">
                    We respect your privacy. No spam, ever.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>

        <TestimonialSlider testimonials={testimonials} />

        <section className="bg-white py-16">
          <div className="container mx-auto px-4 text-center">
            <p className="mb-8 text-sm font-bold uppercase tracking-widest text-gray-400">
              Trusted by industry leaders across sectors
            </p>
            <div className="flex flex-wrap items-center justify-center gap-12 opacity-50 grayscale transition-all duration-500 hover:grayscale-0">
              <i className="fas fa-building text-5xl hover:text-blue-900"></i>
              <i className="fas fa-landmark text-5xl hover:text-blue-900"></i>
              <i className="fas fa-hospital text-5xl hover:text-blue-900"></i>
              <i className="fas fa-industry text-5xl hover:text-blue-900"></i>
              <i className="fas fa-shopping-cart text-5xl hover:text-blue-900"></i>
            </div>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
