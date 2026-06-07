"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchServices } from "@/lib/features/services/services-slice";

type ServiceCatalogProps = {
  compact?: boolean;
};

export function ServiceCatalog({ compact = false }: ServiceCatalogProps) {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.services.items);
  const status = useAppSelector((state) => state.services.status);
  const error = useAppSelector((state) => state.services.error);

  useEffect(() => {
    if (status === "idle") {
      void dispatch(fetchServices());
    }
  }, [dispatch, status]);

  if (status === "loading") {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: compact ? 3 : 6 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="h-5 w-28 rounded-full bg-slate-100" />
            <div className="mt-6 h-8 w-44 rounded-full bg-slate-200" />
            <div className="mt-6 space-y-3">
              <div className="h-4 rounded-full bg-slate-100" />
              <div className="h-4 rounded-full bg-slate-100" />
              <div className="h-4 w-4/5 rounded-full bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (status === "failed") {
      return (
        <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6">
          <p className="text-sm font-bold text-rose-700">
          Unable to load services from the backend.
          </p>
          <p className="mt-2 text-sm leading-7 text-rose-700/90">{error}</p>
        </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        No categories were returned by the API yet.
      </div>
    );
  }

  const visibleCategories = compact ? categories.slice(0, 3) : categories;

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {visibleCategories.map((category) => (
        <article
          key={category.category}
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <i className={`fas ${category.icon ?? "fa-briefcase"}`} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">
                Category
              </p>
              <h3 className="mt-2 text-xl font-black text-slate-900">
                {category.category}
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {category.services.length} service
                {category.services.length === 1 ? "" : "s"} available
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {category.services.slice(0, compact ? 4 : 6).map((service) => (
              <Link
                key={`${category.category}-${service.slug ?? service.name}`}
                href={service.slug ? `/service/${service.slug}` : "/services"}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{service.name}</h4>
                    <p className="mt-1 text-xs leading-6 text-slate-500">
                      {service.short_description || "Service detail route migration is next."}
                    </p>
                  </div>
                  {service.price ? (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-blue-900">
                      INR {Math.ceil(Number(service.price))}
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
