"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { PublicShell } from "@/components/layout/public-shell";

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const services = [
    {
      title: "Startup Desk",
      desc: "Helping entrepreneurs turn ideas into registered businesses with complete setup support.",
      icon: "fa-rocket",
    },
    {
      title: "Registration Desk",
      desc: "Private Limited Company, LLP, Partnership, and other business registration services.",
      icon: "fa-id-card",
    },
    {
      title: "Trademark & IP",
      desc: "Trademark registration and brand protection for growing businesses.",
      icon: "fa-copyright",
    },
    {
      title: "GST Compliance",
      desc: "GST registration, monthly/quarterly filing, and ongoing compliance support.",
      icon: "fa-file-invoice-dollar",
    },
    {
      title: "Income Tax",
      desc: "Tax filing for businesses, professionals, freelancers, and salaried individuals.",
      icon: "fa-receipt",
    },
    {
      title: "MCA / ROC",
      desc: "Annual ROC filings and complete corporate compliance support.",
      icon: "fa-building-columns",
    },
    {
      title: "Project Finance",
      desc: "Business loan support, funding assistance, and financial structuring.",
      icon: "fa-chart-line",
    },
    {
      title: "MSME Grants",
      desc: "Helping businesses access government schemes and subsidy programs.",
      icon: "fa-hand-holding-dollar",
    },
  ];

  const supportItems = [
    "Registration",
    "Accounting & Bookkeeping",
    "Tax and GST Filing",
    "Taxation",
    "Trademark & IPR Protection",
    "Legal Consultancy",
    "Finance & Loans",
    "Govt. Grants and Subsidies",
    "Branding Kit (Logo, Identity)",
    "Website Setup",
    "HR & Payroll Setup",
    "Compliance Support",
    "Business Advisory",
  ];

  return (
    <PublicShell>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-blue-900 pb-14 pt-24 text-white sm:pb-20 sm:pt-32">
          <div className="absolute right-0 top-0 h-96 w-96 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/5 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 h-80 w-80 -translate-x-1/2 translate-y-1/2 rounded-full bg-amber-500/10 blur-3xl"></div>

          <div className="container relative z-10 mx-auto px-4 text-center">
            <h1 className="mb-6 text-4xl font-black tracking-tight md:text-6xl">
              Doorstep <span className="text-amber-500">Filings</span>
            </h1>
          </div>
        </div>

        {/* Mission & Story */}
        <section className="px-4 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div className="space-y-6">
                <h2 className="text-3xl font-black tracking-tight text-blue-900">
                  Building India’s Business Backbone
                </h2>
                <p className="text-lg leading-relaxed text-gray-600">
                  Making starting and running a business easier, more reliable,
                  and more accessible for entrepreneurs across India.
                </p>
                <p className="text-lg leading-relaxed text-gray-600">
                  We believe every entrepreneur deserves professional support that
                  is simple to understand, transparent to work with, and
                  dependable at every stage of the business journey.
                </p>
                <p className="text-lg leading-relaxed text-gray-600">
                  That’s why we combine modern technology with personalized,
                  on-ground support delivered both online and at your doorstep.
                </p>
                <div className="pt-6">
                  <Link
                    href="/contact"
                    className="rounded-full bg-blue-900 px-8 py-3 font-bold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-black"
                  >
                    Get Started Today
                  </Link>
                </div>
              </div>
              <div className="relative rounded-[2rem] border border-gray-100 bg-white p-6 shadow-2xl sm:p-8 lg:rounded-[3rem] lg:p-10">
                <div className="absolute -right-4 -top-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500 text-2xl text-white shadow-xl shadow-amber-500/30 sm:-right-6 sm:-top-6 sm:h-20 sm:w-20 sm:text-3xl">
                  <i className="fas fa-quote-right"></i>
                </div>
                <h3 className="mb-6 text-2xl font-black text-blue-900">
                  Our Story
                </h3>
                <p className="mb-4 leading-relaxed text-gray-600">
                  DoorstepFilings was created to simplify company registration,
                  taxation, and ongoing compliance. From first-time founders to
                  growing companies, we provide structured guidance and dependable
                  support.
                </p>
                <p className="leading-relaxed text-gray-600">
                  Today, we are building a modern business services platform that
                  focuses on trust, clarity, and long-term relationships with our
                  clients.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* More Than Just Compliance */}
        <section className="relative overflow-hidden bg-blue-900 py-20 text-white">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="container relative z-10 mx-auto px-4">
            <div className="mx-auto mb-16 max-w-4xl text-center">
              <h2 className="mb-6 text-3xl font-black md:text-4xl">
                More Than Just Compliance
              </h2>
              <p className="text-lg text-blue-200">
                When an entrepreneur registers a company, they shouldn&apos;t have to
                search for different service providers. We provide complete
                startup support under one roof.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "One-Stop Solution",
                  desc: "Registration to ROI, everything in one place.",
                  icon: "fa-vault",
                },
                {
                  title: "Ready to Operate",
                  desc: "We ensure you're ready from day one.",
                  icon: "fa-briefcase",
                },
                {
                  title: "Proactive Advisory",
                  desc: "Long-term support for your growth.",
                  icon: "fa-user-tie",
                },
                {
                  title: "Unified Platform",
                  desc: "Managing all compliances seamlessly.",
                  icon: "fa-layer-group",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur-md transition-all hover:bg-white/20"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-xl shadow-lg shadow-amber-500/20">
                    <i className={`fas ${item.icon}`}></i>
                  </div>
                  <h4 className="mb-2 text-lg font-bold">{item.title}</h4>
                  <p className="text-sm leading-relaxed text-blue-100">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* All in One Place - Checklist */}
        <section className="px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="relative flex flex-col gap-8 overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-5 shadow-2xl sm:p-8 md:p-12 lg:flex-row lg:gap-12 lg:rounded-[4rem] lg:p-16">
              <div className="lg:w-1/2">
                <h2 className="mb-6 text-3xl font-black text-blue-900">
                  Complete Startup Support
                </h2>
                <p className="mb-10 text-lg text-gray-600">
                  If you start your business with DoorstepFilings, you don’t need
                  to go anywhere else. Our goal is simple — make sure every
                  business we help create is fully ready to operate.
                </p>
                <Image
                  src="https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&q=80&w=800"
                  alt="Business Growth"
                  width={800}
                  height={500}
                  className="rounded-3xl shadow-2xl"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:w-1/2">
                {supportItems.map((item, i) => (
                  <div
                    key={i}
                    className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-4 transition-colors hover:border-blue-900"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-900 text-xs text-white transition-colors group-hover:bg-amber-500">
                      <i className="fas fa-check"></i>
                    </div>
                    <span className="text-sm font-bold text-gray-700">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
              <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-blue-50 opacity-50 blur-3xl"></div>
            </div>
          </div>
        </section>

        {/* What Makes Us Different */}
        <section className="bg-gray-50 px-4 py-20">
          <div className="mx-auto mb-16 max-w-6xl text-center">
            <h2 className="mb-6 text-3xl font-black text-blue-900 md:text-4xl">
              What Makes Us Different
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600">
              A modern business services platform built on trust, structure, and
              accessibility.
            </p>
          </div>
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Dedicated RMs",
                desc: "Personal relationship managers assigned to your account.",
                icon: "fa-user-group",
              },
              {
                title: "Tech-Driven",
                desc: "Structured, automated service processes for efficiency.",
                icon: "fa-display",
              },
              {
                title: "Transparent Pricing",
                desc: "No hidden costs, clear and structured communication.",
                icon: "fa-tag",
              },
              {
                title: "Centralized Compliance",
                desc: "All your legal filings managed from one central hub.",
                icon: "fa-compass",
              },
              {
                title: "Doorstep Assistance",
                icon: "fa-door-open",
                desc: "On-ground support whenever personal assistance is needed.",
              },
              {
                title: "Trust-Based Model",
                icon: "fa-handshake-angle",
                desc: "Financial compliance built on personalized trust and reliability.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group flex flex-col items-center rounded-3xl border border-gray-50 bg-white p-8 text-center shadow-lg transition-all duration-300 hover:-translate-y-2"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-900 transition-all group-hover:bg-blue-900 group-hover:text-white">
                  <i className={`fas ${item.icon}`}></i>
                </div>
                <h4 className="mb-3 font-black uppercase tracking-tight text-blue-900">
                  {item.title}
                </h4>
                <p className="text-sm leading-relaxed text-gray-500">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Our Services - Desks */}
        <section className="bg-white px-4 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-black text-blue-900 md:text-4xl">
                Our Specialized Service Desks
              </h2>
              <p className="text-gray-500">
                Complete end-to-end business and compliance services for every
                stage.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {services.map((service, i) => (
                <div
                  key={i}
                  className="group rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-xl shadow-blue-900/5 transition-all hover:border-amber-500"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-xl text-amber-600 transition-all group-hover:bg-amber-500 group-hover:text-white">
                    <i className={`fas ${service.icon}`}></i>
                  </div>
                  <h4 className="mb-4 font-black tracking-tight text-blue-900">
                    {service.title}
                  </h4>
                  <p className="text-sm leading-relaxed text-gray-500">
                    {service.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who We Work With */}
        <section className="bg-blue-900 px-4 py-20 text-white">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="mb-12 text-3xl font-black">Who We Work With</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                "Startups",
                "MSMEs",
                "Traders",
                "Small Manufacturers",
                "Freelancers",
                "Professionals",
                "Growing Businesses",
                "Salaried Individuals",
                "Tier-2 & Tier-3 Entrepreneurs",
              ].map((item, i) => (
                <div
                  key={i}
                  className="whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold backdrop-blur-sm"
                >
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-12 text-blue-200">
              Our focus is to make professional business services more accessible
              and reliable for everyone.
            </p>
          </div>
        </section>

        {/* Vision & Mission Cards */}
        <section className="px-4 py-14 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-[2rem] border border-gray-100 bg-white p-6 shadow-2xl sm:p-8 lg:rounded-[3.5rem] lg:p-12">
              <div className="absolute right-0 top-0 h-full w-4 bg-blue-900"></div>
              <h3 className="mb-6 text-3xl font-black text-blue-900">
                Our Mission
              </h3>
              <p className="text-lg leading-relaxed text-gray-600">
                To simplify company registration, taxation, and compliance through
                a combination of technology, structured processes, and dedicated
                on-ground support — delivered both online and at your doorstep.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-[2rem] bg-amber-500 p-6 text-white shadow-2xl shadow-amber-500/20 sm:p-8 lg:rounded-[3.5rem] lg:p-12">
              <div className="absolute right-0 top-0 h-full w-4 bg-white/20"></div>
              <h3 className="mb-6 text-3xl font-black">Our Vision</h3>
              <p className="text-lg leading-relaxed text-amber-50">
                To become India’s most trusted business services platform, helping
                millions of entrepreneurs start, operate, and grow their businesses
                with confidence.
              </p>
            </div>
          </div>
        </section>

        {/* Let's Build Something Together */}
        <section className="relative overflow-hidden px-4 py-20 sm:py-32">
          <div className="absolute inset-0 bg-blue-900"></div>
          <div className="absolute right-0 top-0 h-full w-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>

          <div className="relative z-10 mx-auto max-w-4xl text-center text-white">
            <h2 className="mb-8 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
              Let’s Build Something Together
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-base font-medium text-blue-200 sm:mb-12 sm:text-xl">
              Whether you&apos;re starting your first business or managing compliance
              for a growing company, DoorstepFilings is here to support you at
              every stage.
            </p>
            <div className="flex flex-col justify-center gap-6 md:flex-row">
              <Link
                href="/contact"
                className="flex items-center justify-center gap-3 rounded-full bg-amber-500 px-6 py-4 text-base font-black text-white shadow-2xl shadow-amber-500/30 transition-all hover:bg-white hover:text-blue-900 sm:px-12 sm:py-5 sm:text-lg"
              >
                <i className="fas fa-handshake-simple"></i> Partner With Us
              </Link>
              <a
                href="tel:+919898196396"
                className="flex items-center justify-center gap-3 rounded-full border border-white/20 bg-white/10 px-6 py-4 text-base font-black text-white backdrop-blur-md transition-all hover:bg-white/20 sm:px-12 sm:py-5 sm:text-lg"
              >
                <i className="fas fa-phone-volume"></i> Call an Advisor
              </a>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-6 border-t border-white/10 pt-10 text-blue-200 sm:grid-cols-3 sm:gap-8 sm:pt-12 lg:mt-16">
              <div>
                <h5 className="text-2xl font-black text-white">Simple</h5>
                <p className="text-xs font-bold uppercase tracking-widest">
                  Solutions
                </p>
              </div>
              <div>
                <h5 className="text-2xl font-black text-white">Trusted</h5>
                <p className="text-xs font-bold uppercase tracking-widest">
                  Partners
                </p>
              </div>
              <div>
                <h5 className="text-2xl font-black text-white">Reliable</h5>
                <p className="text-xs font-bold uppercase tracking-widest">
                  Results
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
