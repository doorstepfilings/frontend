import Link from "next/link";
import type { ServiceCategory, ServiceItem } from "@/lib/features/services/types";
import { formatCurrency } from "@/lib/utils/pricing";
import { CategoryIcon } from "@/components/ui/category-icon";

interface HomeServicesProps {
  servicesData: ServiceCategory[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error?: string | null;
  selectedTab: string;
  activeCategory: ServiceCategory | undefined;
  onTabChange: (slug: string) => void;
}

function getServiceHref(service: ServiceItem) {
  return service.link || `/service/${service.slug}`;
}

export function HomeServices({
  servicesData,
  status,
  error,
  selectedTab,
  activeCategory,
  onTabChange,
}: HomeServicesProps) {
  const isLoading = status === "idle" || status === "loading";
  const hasCategories = Array.isArray(servicesData) && servicesData.length > 0;
  const showErrorState = status === "failed";
  const showEmptyState = !isLoading && !showErrorState && !hasCategories;

  return (
    <section className="bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mb-6 text-4xl font-bold text-gray-900">Our Core Services</h2>
          <p className="text-xl text-gray-600">
            Comprehensive financial, legal, and compliance solutions for your business.
          </p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Category sidebar */}
          <div className="w-full lg:w-1/3">
            {isLoading ? (
              <div className="flex flex-col space-y-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="animate-pulse rounded-r-lg border-l-4 border-transparent bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-gray-100" />
                      <div className="flex-1">
                        <div className="h-5 w-32 rounded-full bg-slate-200" />
                        <div className="mt-2 h-3 w-24 rounded-full bg-slate-100" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : hasCategories ? (
              <div className="flex flex-col space-y-2">
                {servicesData.map((tab) => (
                  <button
                    key={tab.slug || tab.id || tab.category}
                    onClick={() => onTabChange(tab.slug ?? "")}
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
                        <CategoryIcon
                          icon={tab.icon}
                          fallback="fa-layer-group"
                          className={`text-lg ${
                            selectedTab === tab.slug ? "text-white" : "text-gray-500"
                          }`}
                        />
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
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  <i className="fas fa-layer-group" />
                </div>
                <p className="mt-4 text-base font-bold text-gray-900">
                  Service categories are getting ready
                </p>
                <p className="mt-2 text-sm leading-7 text-gray-500">
                  This section will populate automatically as soon as the catalog data is available.
                </p>
              </div>
            )}
          </div>

          {/* Service cards grid */}
          <div className="w-full lg:w-2/3">
            {isLoading ? (
              <div className="grid animate-pulse grid-cols-1 gap-6 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
                  >
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full bg-amber-50" />
                        <div className="ml-4">
                          <div className="h-5 w-36 rounded-full bg-slate-200" />
                          <div className="mt-2 h-3 w-24 rounded-full bg-slate-100" />
                        </div>
                      </div>
                      <div className="h-10 w-20 rounded-2xl bg-slate-100" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 rounded-full bg-slate-100" />
                      <div className="h-4 rounded-full bg-slate-100" />
                      <div className="h-4 w-4/5 rounded-full bg-slate-100" />
                    </div>
                    <div className="mt-6 flex justify-end">
                      <div className="h-10 w-10 rounded-full bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activeCategory ? (
              <div className="animate-fade-in grid grid-cols-1 gap-6 md:grid-cols-2">
                {activeCategory.services.map((service) => (
                  <div
                    key={service.id}
                    className="group rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="flex items-center">
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-amber-50 shadow-sm transition-colors group-hover:bg-amber-500">
                          <CategoryIcon
                            icon={activeCategory.icon}
                            fallback="fa-layer-group"
                            className="text-amber-500 group-hover:text-white"
                          />
                        </div>
                        <h3 className="ml-4 text-lg font-bold text-gray-900 transition-colors group-hover:text-blue-900">
                          <Link href={getServiceHref(service)}>{service.name}</Link>
                        </h3>
                      </div>

                      {service.price ? (
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-900">
                            Rs.{formatCurrency(service.price)}
                          </div>
                          <div className="text-xs text-gray-400">+ GST | Govt. fee extra</div>
                        </div>
                      ) : null}
                    </div>

                    <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-gray-600">
                      {service.short_description ??
                        `Expert ${service.name} services for your business compliance.`}
                    </p>

                    <Link
                      href={getServiceHref(service)}
                      className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-all group-hover:bg-blue-900 group-hover:text-white"
                      aria-label={`View ${service.name}`}
                    >
                      <i className="fas fa-chevron-right" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : showErrorState ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-rose-700">
                      We could not load the core services right now.
                    </p>
                    <p className="mt-2 text-sm leading-7 text-rose-700/90">
                      {error || "The catalog API did not return service data for the homepage section."}
                    </p>
                  </div>
                  <Link
                    href="/services"
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-900 px-5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-blue-800"
                  >
                    Open Full Catalog
                  </Link>
                </div>
              </div>
            ) : showEmptyState ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                  <i className="fas fa-briefcase text-lg" />
                </div>
                <p className="mt-4 text-lg font-bold text-gray-900">
                  Services will appear here shortly
                </p>
                <p className="mt-2 text-sm leading-7 text-gray-500">
                  We have kept the section ready, but no service records have been returned yet.
                </p>
                <Link
                  href="/services"
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-blue-900 px-5 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-blue-800"
                >
                  Browse Services
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
                Services will appear here once the catalog is ready.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
