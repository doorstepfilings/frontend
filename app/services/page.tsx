"use client";

import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchServices } from "@/lib/features/services/services-slice";
import { Button } from "@/components/ui/button";
import { PublicShell } from "@/components/layout/public-shell";

const priceFormatter = new Intl.NumberFormat("en-IN");

const resolveServicePrice = (service: any) => {
  const basePrice = Number(service?.price || 0);
  const plans = Array.isArray(service?.pricing_plans) ? service.pricing_plans : [];
  const planPrices = plans
    .map((plan: any) => Number(plan?.price || 0))
    .filter((price: number) => Number.isFinite(price) && price > 0);

  if (planPrices.length > 0) {
    return Math.min(...planPrices);
  }

  return basePrice > 0 ? basePrice : null;
};

const sortServices = (services: any[], sortBy: string) => {
  const sorted = [...services];

  if (sortBy === "name_asc") {
    sorted.sort((left, right) => left.name.localeCompare(right.name));
  } else if (sortBy === "price_low") {
    sorted.sort((left, right) => (left.priceFrom ?? Number.MAX_SAFE_INTEGER) - (right.priceFrom ?? Number.MAX_SAFE_INTEGER));
  } else if (sortBy === "price_high") {
    sorted.sort((left, right) => (right.priceFrom ?? 0) - (left.priceFrom ?? 0));
  }

  return sorted;
};

export default function ServicesDirectoryPage() {
  const dispatch = useAppDispatch();
  const { items: categories, loading } = useAppSelector((state) => state.services);
  
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (!Array.isArray(categories) || categories.length === 0) {
      dispatch(fetchServices());
    }
  }, [categories, dispatch]);

  const normalizedCategories = Array.isArray(categories) ? categories : [];

  const serviceIndex = useMemo(() => {
    return normalizedCategories.flatMap((category) => {
      const services = Array.isArray(category?.services) ? category.services : [];

      return services.map((service, index) => ({
        ...service,
        listingOrder: index,
        categoryId: category.id,
        categoryName: category.category,
        categorySlug: category.slug,
        categoryIcon: category.icon || "fa-layer-group",
        priceFrom: resolveServicePrice(service),
        destination: `/services/${service.slug}`,
      }));
    });
  }, [normalizedCategories]);

  const loweredQuery = deferredQuery.trim().toLowerCase();

  const matchesQuery = (service: any) => {
    if (!loweredQuery) return true;
    const haystack = [service.name, service.short_description, service.description, service.categoryName]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(loweredQuery);
  };

  const categoryOptions = useMemo(() => {
    return normalizedCategories
      .map((category) => {
        const categoryServices = serviceIndex.filter((service) => service.categorySlug === category.slug);
        return {
          id: category.id,
          slug: category.slug,
          category: category.category,
          icon: category.icon || "fa-layer-group",
          totalCount: categoryServices.length,
        };
      })
      .filter((category) => category.totalCount > 0);
  }, [normalizedCategories, serviceIndex]);

  const filteredServices = useMemo(() => {
    const visible = serviceIndex.filter((service) => {
      const categoryMatch = activeCategory === "all" || service.categorySlug === activeCategory;
      return categoryMatch && matchesQuery(service);
    });

    return sortServices(visible, sortBy);
  }, [activeCategory, loweredQuery, serviceIndex, sortBy]);

  const clearFilters = () => {
    setQuery("");
    setActiveCategory("all");
    setSortBy("featured");
  };

  return (
    <PublicShell>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-slate-950 pb-24 pt-16 lg:pb-32 lg:pt-24">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
            <div className="absolute left-[-12rem] top-[-10rem] h-[28rem] w-[28rem] rounded-full bg-blue-600/20 blur-[120px]" />
            <div className="absolute bottom-[-12rem] right-[-8rem] h-[24rem] w-[24rem] rounded-full bg-amber-500/20 blur-[110px]" />
          </div>

          <div className="container relative mx-auto px-4">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-300">Explore Services</span>
              </div>
              <h1 className="mt-6 text-4xl font-black leading-tight text-white sm:text-5xl lg:text-7xl">
                Professional Business <br /> <span className="text-blue-400">Filings & Compliance.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
                Simplify your business operations with our comprehensive range of taxation, registration, and advisory services.
              </p>
            </div>
          </div>
        </section>

        {/* Filter Section */}
        <section className="container relative z-20 mx-auto -mt-12 px-4">
          <div className="rounded-3xl border border-white/10 bg-white/80 p-4 shadow-2xl backdrop-blur-xl sm:p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search services..."
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-bold outline-none transition-all focus:border-blue-900 focus:bg-white"
                />
              </div>

              <div className="relative">
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  className="h-14 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-blue-900"
                >
                  <option value="all">All Categories</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat.id} value={cat.slug}>{cat.category}</option>
                  ))}
                </select>
                <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400" />
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-14 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-blue-900"
                >
                  <option value="featured">Sort by: Featured</option>
                  <option value="name_asc">Name: A to Z</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
                <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400" />
              </div>

              <button
                onClick={clearFilters}
                className="h-14 rounded-2xl bg-blue-900 font-bold text-white transition-all hover:bg-blue-800"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="container mx-auto px-4 py-16">
          {loading && serviceIndex.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-900 border-t-transparent" />
              <p className="mt-4 text-slate-500 font-bold">Loading services...</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 py-32 text-center">
              <h3 className="text-2xl font-bold text-slate-900">No services found</h3>
              <p className="mt-2 text-slate-500">Try adjusting your filters or search query.</p>
              <Button variant="outline" onClick={clearFilters} className="mt-6">Clear Filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map((service) => (
                <Link
                  key={service.id}
                  href={service.destination}
                  className="group relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-8 transition-all duration-500 hover:-translate-y-2 hover:border-blue-900 hover:shadow-2xl"
                >
                  <div className="absolute right-0 top-0 h-32 w-32 translate-x-12 translate-y-[-12px] rounded-full bg-blue-50/50 transition-transform duration-500 group-hover:scale-150" />
                  
                  <div className="relative">
                    <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-900">
                      <i className={`fas ${service.categoryIcon} text-amber-500`} />
                      {service.categoryName}
                    </div>
                    
                    <h3 className="mt-6 text-2xl font-black text-slate-900 group-hover:text-blue-900">{service.name}</h3>
                    <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500">
                      {service.short_description || service.description || "Expert support for your business compliance and filing needs."}
                    </p>
                    
                    <div className="mt-8 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Starts From</p>
                        <p className="mt-1 text-2xl font-black text-amber-600">
                          {service.priceFrom ? `₹${priceFormatter.format(service.priceFrom)}` : "Contact"}
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-slate-900 text-white flex items-center justify-center transition-all duration-300 group-hover:bg-blue-900 group-hover:scale-110">
                          <i className="fas fa-arrow-right"></i>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </PublicShell>
  );
}
