"use client";

import Link from "next/link";
import { isAxiosError } from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PublicShell } from "@/components/layout/public-shell";
import { apiClient } from "@/lib/api/client";
import { useStoredUser } from "@/lib/auth/hooks";
import { formatPrice } from "@/lib/utils/pricing";
import { ApplyServiceModal } from "./apply-service-modal";
import { PageLogoLoader } from "@/components/ui/logo-loader";

type ServiceDetailResponse = {
  data?: ServiceDetail;
  message?: string;
};

type PricingPlan = {
  name: string;
  price: string | number;
  features: string[];
};

type ServiceDetail = {
  id: number;
  name: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  long_description?: string | null;
  price?: number | string | null;
  faqs?: Array<{ question?: string; answer?: string }>;
  pricing_plans?: PricingPlan[] | null;
  benefits?: string[];
  category?: {
    name?: string;
    slug?: string;
  } | null;
  documents?: Array<{
    id: number;
    document_name?: string | null;
    description?: string | null;
    is_required?: boolean;
    document_type?: string;
  }>;
};

export function ServiceDetailView({ slug }: { slug: string }) {
  const router = useRouter();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("loading");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const user = useStoredUser();
  const canApply = !user || user.role === "user";

  useEffect(() => {
    let isMounted = true;

    async function loadService() {
      setStatus("loading");
      try {
        const response = await apiClient.get<ServiceDetailResponse>(`/service/${slug}`);
        if (isMounted) {
          setService(response.data?.data ?? null);
          setStatus("success");
        }
      } catch (requestError) {
        if (isMounted) {
          const message = isAxiosError(requestError)
            ? (requestError.response?.data?.message ?? requestError.message)
            : "Unable to load service details.";
          setError(message);
          setStatus("error");
        }
      }
    }

    void loadService();
    return () => { isMounted = false; };
  }, [slug]);

  const handleApplyNow = (_planName?: string) => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/service/${slug}`)}`);
      return;
    }
    if (service) {
      localStorage.setItem("selectedService", JSON.stringify(service));
    }
    setShowModal(true);
  };

  if (status === "loading") {
    return (
      <PublicShell>
        <PageLogoLoader
          className="min-h-screen bg-slate-50"
          label="Loading service intelligence..."
          size={64}
        />
      </PublicShell>
    );
  }

  if (status === "error" || !service) {
    return (
      <PublicShell>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-exclamation-triangle text-rose-500 text-3xl"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Service Not Found</h2>
            <p className="text-slate-600 mb-8">{error || "The requested service is currently unavailable."}</p>
            <Link href="/services" className="inline-flex items-center gap-2 px-8 py-4 bg-blue-900 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-800 transition-all">
              <i className="fas fa-arrow-left"></i> Back to Catalog
            </Link>
          </div>
        </div>
      </PublicShell>
    );
  }

  return (
    <>
      <PublicShell>
        <div className="bg-slate-50 min-h-screen font-sans">
          {/* Laravel-Style Hero Section with Common Service Banner Background */}
          <div
            className="py-24 relative overflow-hidden bg-slate-50 border-b border-slate-100 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('/assets/images/service-banner.png?v=3')` }}
          >
            <div className="container mx-auto px-4 relative z-10 text-center">
              <p className="text-amber-600 font-black uppercase tracking-[0.3em] text-[10px] mb-4">
                {service.category?.name || 'Compliance Service'}
              </p>
              <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-slate-900">{service.name}</h1>
              <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-semibold">
                {service.short_description || `Professional handling of your ${service.name} needs with precision and care.`}
              </p>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="bg-slate-100">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Link href="/" className="hover:text-amber-600 transition-colors">Home</Link>
                <span>/</span>
                <Link href="/services" className="hover:text-amber-600 transition-colors">Services</Link>
                <span>/</span>
                <span className="text-slate-900">{service.name}</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="container mx-auto px-4 py-16">
            <div className="flex flex-col lg:flex-row gap-12">

              {/* Left Column: Details */}
              <div className="lg:w-2/3 space-y-12">

                {/* Overview */}
                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                  <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <i className="fas fa-align-left text-sm"></i>
                    </div>
                    Service Overview
                  </h2>
                  <div
                    className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-sm lg:text-base quill-content"
                    dangerouslySetInnerHTML={{ __html: service.long_description || service.description || "Information currently being updated." }}
                  />
                </div>

                {/* Pricing Plans Grid */}
                {service.pricing_plans && service.pricing_plans.length > 0 && (
                  <div className="space-y-8">
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <i className="fas fa-tags text-sm"></i>
                      </div>
                      Select Your Plan
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {service.pricing_plans.map((plan, idx) => (
                        <div key={idx} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden flex flex-col hover:shadow-xl transition-all hover:-translate-y-1 group">
                          <div className="p-8 bg-blue-900 text-white text-center">
                            <h4 className="font-bold text-sm uppercase tracking-widest mb-2">{plan.name}</h4>
                            <div className="text-3xl font-black text-white-200">
                              {`₹${formatPrice(plan.price)}`}
                            </div>
                          </div>
                          <div className="p-8 flex-1 flex flex-col">
                            <ul className="space-y-4 mb-8 flex-1">
                              {plan.features.map((feature, fIdx) => (
                                <li key={fIdx} className="flex items-start gap-3 text-[13px] text-slate-600 font-medium">
                                  <i className="fas fa-check-circle text-emerald-500 mt-0.5"></i>
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                            {canApply && (
                              <button
                                onClick={() => handleApplyNow(plan.name)}
                                className="w-full py-4 bg-slate-50 text-blue-900 font-black uppercase tracking-widest text-[10px] rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-all"
                              >
                                Select Plan
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Required Documents Grid */}
                {service.documents && service.documents.length > 0 && (
                  <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                    <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <i className="fas fa-file-alt text-sm"></i>
                      </div>
                      Required Documents
                    </h2>
                    <p className="text-sm text-slate-500 mb-8 font-medium">
                      Prepare the following documents for a seamless application process.
                      Items marked with <span className="text-rose-500">*</span> are mandatory.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {service.documents.map((doc, idx) => (
                        <div key={idx} className={`p-5 rounded-2xl border transition-all ${doc.is_required ? 'border-amber-100 bg-amber-50/30' : 'border-slate-100 bg-slate-50/50'}`}>
                          <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${doc.is_required ? 'bg-amber-100 text-amber-600 shadow-sm' : 'bg-white border border-slate-200 text-slate-400'}`}>
                              <i className="fas fa-file-invoice"></i>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-slate-900 text-sm">
                                {doc.document_name} {doc.is_required && <span className="text-rose-500">*</span>}
                              </h4>
                              {doc.description && <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{doc.description}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQs Accordion */}
                {service.faqs && service.faqs.length > 0 && (
                  <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                    <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                        <i className="fas fa-question-circle text-sm"></i>
                      </div>
                      Common Questions
                    </h2>
                    <div className="space-y-4">
                      {service.faqs.map((faq, idx) => (
                        <details key={idx} className="group border border-slate-100 rounded-2xl open:bg-slate-50 transition-all">
                          <summary className="flex cursor-pointer items-center justify-between p-6 font-bold text-slate-800 text-sm">
                            {faq.question}
                            <span className="ml-auto shrink-0 transition duration-300 group-open:-rotate-180 text-blue-900">
                              <i className="fas fa-chevron-down text-xs"></i>
                            </span>
                          </summary>
                          <div className="px-6 pb-6 pt-0 text-slate-600 text-sm leading-relaxed border-t border-slate-200/40 mt-1 pt-4">
                            {faq.answer}
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Sidebar */}
              <div className="lg:w-1/3 space-y-6">

                {/* Application Card */}
                <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 overflow-hidden sticky top-24 z-20">
                  <div className="p-6 md:p-8">
                    {service.price && (
                      <div className="flex flex-col gap-1 mb-8">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Starting at</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl md:text-5xl font-black text-blue-900 tracking-tight">₹{formatPrice(service.price)}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">+ GST</span>
                        </div>
                      </div>
                    )}

                    {canApply && (
                      <button
                        onClick={() => handleApplyNow()}
                        className="w-full h-14 bg-amber-500 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl hover:bg-amber-600 hover:-translate-y-0.5 transition-all duration-300 shadow-[0_8px_20px_rgb(245,158,11,0.25)] flex items-center justify-center gap-3"
                      >
                        <i className="fas fa-rocket text-sm"></i>
                        Apply Now
                      </button>
                    )}
                  </div>
                </div>

                {/* Need Help Card */}
                <div className="bg-[#0f172a] rounded-3xl shadow-xl p-6 md:p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-blue-600/20 blur-2xl pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 rounded-full bg-indigo-600/20 blur-2xl pointer-events-none"></div>

                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-5 border border-white/10 backdrop-blur-sm">
                      <i className="fas fa-headset text-xl text-amber-400"></i>
                    </div>
                    <h3 className="text-xl font-black mb-3 tracking-tight">Need Expert Help?</h3>
                    <p className="text-slate-300 text-sm mb-8 leading-relaxed font-medium">
                      Our experts are available to clarify your doubts and guide you through the compliance journey.
                    </p>
                    <div className="flex flex-col gap-3">
                      <a
                        href="tel:+919898196396"
                        className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 hover:bg-white/10 transition-all border border-white/10 group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                          <i className="fas fa-phone-alt text-sm"></i>
                        </div>
                        <span className="font-black text-base tracking-wide">+91 9898 196 396</span>
                      </a>
                      <Link
                        href="/contact"
                        className="flex items-center justify-center h-14 bg-transparent border-2 border-white/20 text-white font-bold text-sm rounded-2xl hover:bg-white/10 hover:border-white/30 transition-all"
                      >
                        Get Consultation
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Key Benefits Card */}
                <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 border border-slate-200">
                  <h3 className="text-base font-black text-slate-900 mb-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                      <i className="fas fa-award text-sm"></i>
                    </div>
                    Key Benefits
                  </h3>
                  <ul className="space-y-4">
                    {(service.benefits || [
                      "Maximize Tax Savings",
                      "Eliminate Compliance Risks",
                      "Professional Documentation",
                      "End-to-End Assistance",
                      "Secure Data Transmission"
                    ]).map((benefit, i) => (
                      <li key={i} className="flex items-start gap-3 text-xs font-bold text-slate-600 leading-relaxed">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5"></div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PublicShell>

      {/* Apply Modal — same pattern as Laravel project */}
      {service && (
        <ApplyServiceModal
          service={service}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
