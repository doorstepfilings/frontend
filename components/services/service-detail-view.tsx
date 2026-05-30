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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">Loading service intelligence...</p>
          </div>
        </div>
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
          {/* Laravel-Style Hero Section */}
          <div className="bg-blue-900 text-white py-24 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400 rounded-full blur-[120px] transform translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-400 rounded-full blur-[100px] transform -translate-x-1/2 translate-y-1/2"></div>
            </div>
            <div className="container mx-auto px-4 relative z-10 text-center">
              <p className="text-amber-400 font-black uppercase tracking-[0.3em] text-[10px] mb-4">
                {service.category?.name || 'Compliance Service'}
              </p>
              <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">{service.name}</h1>
              <p className="text-lg md:text-xl text-blue-100/80 max-w-2xl mx-auto leading-relaxed">
                {service.short_description || `Professional handling of your ${service.name} needs with precision and care.`}
              </p>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="bg-white border-b border-slate-100">
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
                            <h4 className="font-bold text-sm uppercase tracking-widest opacity-70 mb-2">{plan.name}</h4>
                            <div className="text-3xl font-black text-amber-400">
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
                            <button
                              onClick={() => handleApplyNow(plan.name)}
                              className="w-full py-4 bg-slate-50 text-blue-900 font-black uppercase tracking-widest text-[10px] rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all"
                            >
                              Select Plan
                            </button>
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
              <div className="lg:w-1/3 space-y-8">

                {/* Application Card */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-blue-900/5 p-8 border-t-[6px] border-amber-500 sticky top-24">
                  {service.price && (
                    <div className="mb-8 text-center bg-slate-50 rounded-2xl py-6">
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Service Fee Starting At</p>
                      <p className="text-4xl font-black text-blue-900">₹{formatPrice(service.price)}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-tighter">+ GST | GOVT. FEE EXTRA</p>
                    </div>
                  )}
                  <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Apply for Service</h3>
                  <p className="text-slate-500 mb-8 text-sm font-medium leading-relaxed">
                    Start your {service.name.toLowerCase()} application today with professional assistance.
                  </p>

                  <div className="space-y-4">
                    <button
                      onClick={() => handleApplyNow()}
                      className="w-full bg-amber-500 text-white font-black uppercase tracking-widest text-xs py-5 rounded-2xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-3"
                    >
                      <i className="fas fa-rocket text-sm"></i>
                      Apply Now
                    </button>
                    <Link
                      href="/contact"
                      className="w-full block text-center px-4 py-5 border-2 border-blue-900 text-blue-900 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-blue-900 hover:text-white transition-all"
                    >
                      <i className="fas fa-phone-alt mr-2"></i>
                      Get Consultation
                    </Link>
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                    {[
                      { icon: 'fa-shield-halved', text: 'Secure Data Transmission', color: 'text-emerald-500' },
                      { icon: 'fa-clock', text: 'Guaranteed Timely Filing', color: 'text-blue-500' },
                      { icon: 'fa-headset', text: '24/7 Expert Support', color: 'text-amber-500' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4 text-xs font-bold text-slate-600">
                        <div className={`w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center ${item.color}`}>
                          <i className={`fas ${item.icon}`}></i>
                        </div>
                        {item.text}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Need Help Card */}
                <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-[2.5rem] shadow-lg p-8 text-white">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                    <i className="fas fa-headset text-xl text-amber-400"></i>
                  </div>
                  <h3 className="text-xl font-black mb-3 tracking-tight">Need Expert Help?</h3>
                  <p className="text-blue-100/70 text-sm mb-6 leading-relaxed font-medium">
                    Our experts are available to clarify your doubts and guide you through the compliance journey.
                  </p>
                  <a
                    href="tel:+919898196396"
                    className="flex items-center gap-4 bg-white/10 rounded-2xl p-4 hover:bg-white/20 transition-all border border-white/5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-400 text-blue-900 flex items-center justify-center shadow-lg">
                      <i className="fas fa-phone-alt text-sm"></i>
                    </div>
                    <span className="font-black text-base">+91 9898 196 396</span>
                  </a>
                </div>

                {/* Key Benefits Card */}
                <div className="bg-white rounded-[2.5rem] shadow-sm p-8 border border-slate-100">
                  <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
                    <i className="fas fa-award text-amber-500"></i>
                    Key Benefits
                  </h3>
                  <ul className="space-y-4">
                    {(service.benefits || [
                      "Maximize Tax Savings",
                      "Eliminate Compliance Risks",
                      "Professional Documentation",
                      "End-to-End Assistance"
                    ]).map((benefit, i) => (
                      <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
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
