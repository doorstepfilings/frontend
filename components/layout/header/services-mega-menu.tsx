import Link from "next/link";
import type { ServiceCategory } from "@/lib/features/services/types";

interface ServicesMegaMenuProps {
  servicesData: ServiceCategory[];
  activeServiceTab: number;
  isVisible: boolean;
  onTabChange: (idx: number) => void;
}

export function ServicesMegaMenu({
  servicesData,
  activeServiceTab,
  isVisible,
  onTabChange,
}: ServicesMegaMenuProps) {
  const activeCategory = servicesData[activeServiceTab];

  return (
    <div
      className={`absolute left-1/2 top-full max-h-[calc(100dvh-6rem)] w-[min(1000px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-gray-100/50 bg-white shadow-xl shadow-blue-900/10 transition-all duration-300 ${
        isVisible
          ? "visible translate-y-2 opacity-100"
          : "invisible translate-y-4 opacity-0"
      }`}
    >
      <div className="flex max-h-[calc(100dvh-6rem)] min-h-[360px]">
        {/* Category sidebar */}
        <div className="w-64 shrink-0 overflow-y-auto border-r border-gray-100 bg-gray-50/50 py-6 xl:w-72">
          <div className="mb-4 px-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
              Service Categories
            </h3>
          </div>
          <div className="flex flex-col">
            {servicesData.map((category, idx) => (
              <button
                key={idx}
                onMouseEnter={() => onTabChange(idx)}
                className={`group/tab flex items-center justify-between px-6 py-3.5 text-left transition-all duration-200 ${
                  activeServiceTab === idx
                    ? "border-l-4 border-amber-500 bg-white text-blue-900 shadow-sm"
                    : "border-l-4 border-transparent text-gray-600 hover:bg-gray-100 hover:text-blue-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      activeServiceTab === idx
                        ? "bg-blue-50 text-blue-600"
                        : "bg-gray-200/50 text-gray-400 group-hover/tab:bg-blue-50 group-hover/tab:text-blue-600"
                    }`}
                  >
                    <i className={`fas ${category.icon} text-sm`} />
                  </div>
                  <span className="text-[13px] font-semibold">{category.category}</span>
                </div>
                <i
                  className={`fas fa-chevron-right text-xs transition-all ${
                    activeServiceTab === idx
                      ? "translate-x-0 text-amber-500 opacity-100"
                      : "-translate-x-2 opacity-0"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Services panel */}
        <div className="relative min-w-0 flex-1 overflow-y-auto bg-white p-6 xl:p-8">
          {activeCategory && (
            <div className="animate-fade-in">
              {/* Panel header */}
              <div className="mb-8 flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="mb-1 flex items-center gap-2 text-xl font-bold text-blue-900">
                    {activeCategory.category}
                    <span className="rounded-full border border-gray-100 bg-gray-50 px-2 py-0.5 text-xs font-normal text-gray-400">
                      {activeCategory.services?.length} Services
                    </span>
                  </h3>
                  <p className="text-sm text-gray-500">
                    Explore our professional services in this category
                  </p>
                </div>
                <Link
                  href="/services"
                  className="group/link flex items-center gap-1 text-sm font-semibold text-amber-500 transition-colors hover:text-amber-600"
                >
                  View All{" "}
                  <i className="fas fa-arrow-right text-xs transition-transform group-hover/link:translate-x-1" />
                </Link>
              </div>

              {/* Service links grid */}
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 xl:grid-cols-2">
                {activeCategory.services?.map((service, sIdx) => (
                  <Link
                    key={sIdx}
                    href={service.link || `/service/${service.slug}`}
                    className="group/item flex items-start gap-3 rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-blue-50 hover:bg-blue-50/30"
                  >
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-300 transition-colors group-hover/item:bg-amber-500" />
                    <div>
                      <h4 className="mb-0.5 text-sm font-bold text-gray-700 transition-colors group-hover/item:text-blue-900">
                        {service.name}
                      </h4>
                      <p className="line-clamp-1 text-xs text-gray-400 transition-colors group-hover/item:text-blue-400/80">
                        {service.short_description ?? "Expert financial solutions"}
                      </p>
                    </div>
                    <i className="fas fa-external-link-alt ml-auto mt-1 text-[10px] text-gray-300 opacity-0 transition-opacity group-hover/item:opacity-100" />
                  </Link>
                ))}
              </div>

              {/* Consultation CTA */}
              <div className="mt-8 flex items-center justify-between rounded-xl border border-blue-50 bg-gradient-to-r from-blue-50 to-transparent p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                    <i className="fas fa-headset" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-blue-900">
                      Need specific help with {activeCategory.category}?
                    </h5>
                    <p className="text-xs text-gray-500">Our experts are ready to assist you.</p>
                  </div>
                </div>
                <Link
                  href="/contact"
                  className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-900/10 transition-colors hover:bg-amber-500"
                >
                  Get Consultation
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
