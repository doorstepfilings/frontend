"use client";

import Link from "next/link";
import { isAxiosError } from "axios";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PublicShell } from "@/components/layout/public-shell";
import { apiClient } from "@/lib/api/client";
import { useStoredUser } from "@/lib/auth/hooks";

type ServiceDetailResponse = {
  data?: ServiceDetail;
  message?: string;
};

type ServiceDetail = {
  id: number;
  name: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  long_description?: string | null;
  link?: string | null;
  price?: number | string | null;
  faqs?: Array<{ question?: string; answer?: string } | string>;
  pricing_plans?: Array<Record<string, unknown>> | Record<string, unknown> | null;
  required_documents_list?: Array<string | Record<string, unknown>>;
  extra_documents?: Array<string | Record<string, unknown>>;
  category?: {
    name?: string;
    slug?: string;
    icon?: string | null;
  } | null;
  documents?: Array<{
    id: number;
    document_name?: string | null;
    name?: string | null;
    description?: string | null;
    is_required?: boolean;
  }>;
};

function stringifyItem(item: string | Record<string, unknown>) {
  if (typeof item === "string") {
    return item;
  }

  return Object.values(item)
    .filter((value) => value !== null && value !== undefined && value !== "")
    .join(" - ");
}

export function ServiceDetailView({ slug }: { slug: string }) {
  const router = useRouter();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("loading");
  const [error, setError] = useState("");
  const [cartActionState, setCartActionState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [cartMessage, setCartMessage] = useState("");
  const user = useStoredUser();

  useEffect(() => {
    let isMounted = true;

    async function loadService() {
      setStatus("loading");
      setError("");

      try {
        const response = await apiClient.get<ServiceDetailResponse>(`/service/${slug}`);

        if (!isMounted) {
          return;
        }

        setService(response.data?.data ?? null);
        setStatus("success");
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        const message =
          isAxiosError(requestError)
            ? (requestError.response?.data?.message ?? requestError.message)
            : requestError instanceof Error
              ? requestError.message
              : "Unable to load service details.";

        setError(message);
        setStatus("error");
      }
    }

    void loadService();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  async function handleAddToCart() {
    if (!service?.id) {
      return;
    }

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/service/${slug}`)}`);
      return;
    }

    setCartActionState("loading");
    setCartMessage("");

    try {
      await apiClient.post("/service/cart/add", {
        service_id: service.id,
      });
      setCartActionState("success");
      setCartMessage("Service added to your cart.");
    } catch (requestError) {
      const message =
        isAxiosError(requestError)
          ? (requestError.response?.data?.message ?? requestError.message)
          : requestError instanceof Error
            ? requestError.message
            : "Unable to add this service to your cart.";

      setCartActionState("error");
      setCartMessage(message);
    }
  }

  const overview = service?.long_description ?? service?.description ?? service?.short_description;
  const requiredDocuments = [
    ...(service?.required_documents_list ?? []),
    ...((service?.documents ?? []).map(
      (document) =>
        document.document_name ?? document.name ?? document.description ?? "Required document",
    )),
  ];
  const extraDocuments = service?.extra_documents ?? [];
  const faqs = service?.faqs ?? [];

  function handleApplyNow() {
    if (service) {
      localStorage.setItem("selectedService", JSON.stringify(service));
    }

    router.push("/apply-service");
  }

  return (
    <PublicShell>
      <section className="bg-slate-950 text-white">
        <div className="container mx-auto px-4 py-16">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-bold text-amber-300 transition hover:text-amber-200"
          >
            <i className="fas fa-arrow-left text-xs" />
            Back to Services
          </Link>

          {status === "loading" ? (
            <div className="mt-8 animate-pulse space-y-4">
              <div className="h-4 w-32 rounded-full bg-white/10" />
              <div className="h-12 w-2/3 rounded-2xl bg-white/10" />
              <div className="h-4 w-full rounded-full bg-white/10" />
              <div className="h-4 w-5/6 rounded-full bg-white/10" />
            </div>
          ) : status === "error" ? (
            <div className="mt-8 rounded-[2rem] border border-rose-300/30 bg-rose-500/10 p-6">
              <h1 className="text-3xl font-black">Service unavailable</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-rose-100">{error}</p>
            </div>
          ) : service ? (
            <>
              <p className="mt-8 text-xs font-black uppercase tracking-[0.24em] text-amber-300">
                {service.category?.name ?? "Professional Service"}
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">
                {service.name}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
                {overview || "Detailed service information is available through the migrated backend."}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                {service.price ? (
                  <span className="rounded-full bg-amber-400 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-950">
                    Starting at INR {Math.ceil(Number(service.price))}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => void handleAddToCart()}
                  disabled={cartActionState === "loading"}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cartActionState === "loading" ? "Adding..." : "Add to Cart"}
                  <i className="fas fa-cart-plus text-xs" />
                </button>
                <button
                  type="button"
                  onClick={handleApplyNow}
                  className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition hover:bg-blue-500"
                >
                  Apply Now
                  <i className="fas fa-arrow-right text-xs" />
                </button>
                {user ? (
                  <Link
                    href="/cart"
                    className="inline-flex items-center gap-2 text-sm font-bold text-amber-200 transition hover:text-white"
                  >
                    Open Cart
                    <i className="fas fa-arrow-right text-xs" />
                  </Link>
                ) : null}
              </div>
              {cartMessage ? (
                <div
                  className={`mt-4 inline-flex rounded-2xl px-4 py-3 text-sm font-medium ${
                    cartActionState === "success"
                      ? "bg-emerald-500/15 text-emerald-100"
                      : "bg-rose-500/15 text-rose-100"
                  }`}
                >
                  {cartMessage}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </section>

      {service ? (
        <section className="container mx-auto px-4 py-16">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">
                  Overview
                </p>
                <p className="mt-4 text-sm leading-8 text-slate-700">
                  {overview || "No additional overview is available yet for this service."}
                </p>
              </article>

              <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">
                  Required Documents
                </p>
                {requiredDocuments.length > 0 ? (
                  <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
                    {requiredDocuments.map((item, index) => (
                      <li key={`${slug}-required-${index}`} className="flex gap-3">
                        <i className="fas fa-file-lines mt-1 text-blue-600" />
                        <span>{stringifyItem(item)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    Required documents will be confirmed during application.
                  </p>
                )}
              </article>

              {faqs.length > 0 ? (
                <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">
                    FAQs
                  </p>
                  <div className="mt-5 space-y-4">
                    {faqs.map((faq, index) => (
                      <div key={`${slug}-faq-${index}`} className="rounded-2xl bg-slate-50 p-5">
                        <p className="text-sm font-black text-slate-900">
                          {typeof faq === "string"
                            ? `Question ${index + 1}`
                            : String(faq.question ?? `Question ${index + 1}`)}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">
                          {typeof faq === "string" ? faq : String(faq.answer ?? "")}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              ) : null}
            </div>

            <aside className="space-y-6">
              <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">
                  Service Snapshot
                </p>
                <div className="mt-5 space-y-4 text-sm text-slate-700">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                      Category
                    </p>
                    <p className="mt-2 font-bold text-slate-900">
                      {service.category?.name ?? "General"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                      Starting Price
                    </p>
                    <p className="mt-2 font-bold text-slate-900">
                      {service.price ? `INR ${Math.ceil(Number(service.price))}` : "Contact us"}
                    </p>
                  </div>
                  {service.link ? (
                    <a
                      href={service.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-600"
                    >
                      Open External Reference
                      <i className="fas fa-up-right-from-square text-xs" />
                    </a>
                  ) : null}
                </div>
              </article>

              {extraDocuments.length > 0 ? (
                <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">
                    Additional Documents
                  </p>
                  <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
                    {extraDocuments.map((item, index) => (
                      <li key={`${slug}-extra-${index}`} className="flex gap-3">
                        <i className="fas fa-folder-plus mt-1 text-amber-500" />
                        <span>{stringifyItem(item)}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ) : null}
            </aside>
          </div>
        </section>
      ) : null}
    </PublicShell>
  );
}
