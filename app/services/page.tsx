"use client";

import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchServices } from "@/lib/features/services/services-slice";
import { Button } from "@/components/ui/button";
import { PublicShell } from "@/components/layout/public-shell";
import { PanelLogoLoader } from "@/components/ui/logo-loader";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getServicePurchasePrice } from "@/lib/utils/pricing";

const priceFormatter = new Intl.NumberFormat("en-IN");

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
  const [showFilters, setShowFilters] = useState(false);
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
        priceFrom: getServicePurchasePrice(service),
        destination: `/services/${service.slug}`,
      }));
    });
  }, [normalizedCategories]);

  const loweredQuery = deferredQuery.trim().toLowerCase();

  const matchesQuery = (service: any) => {
    if (!loweredQuery) return true;
    return service.name.toLowerCase().includes(loweredQuery);
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
        {/* Simple Header with Background Image */}
        <section className="relative overflow-hidden bg-slate-900 py-12 text-white">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop"
              alt="Clean Corporate Building"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="container relative z-10 mx-auto px-4 pb-4 text-center">
            <div className="inline-block rounded-3xl bg-slate-950/75 backdrop-blur-md px-6 py-4 max-w-lg mx-auto border border-white/10 shadow-lg">
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Our Services
              </h1>
              <p className="mt-1.5 text-xs md:text-sm font-medium text-blue-100">
                Simplify your business operations with our comprehensive range of taxation, registration, and advisory services.
              </p>
            </div>
          </div>
        </section>

        {/* Filter Section */}
        <section className="sticky top-24 z-30 container mx-auto px-4 max-w-3xl -mt-6">
          <div className="rounded-2xl border border-slate-100/80 bg-white/95 backdrop-blur-md p-3 shadow-lg space-y-3">
            {/* Search Input and Toggle Button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search services..."
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-bold outline-none transition-all focus:border-blue-900 focus:bg-white"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`h-12 px-5 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all text-sm ${
                  showFilters
                    ? "bg-blue-900 border-blue-900 text-white shadow-md shadow-blue-900/20"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <i className={`fas ${showFilters ? "fa-times" : "fa-sliders"}`} />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>
            </div>

            {/* Collapsible Filter Options */}
            {showFilters && (
              <div className="grid gap-3 md:grid-cols-3 pt-3 border-t border-slate-100 animate-slideDown">
                <SearchableSelect
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  options={[
                    { value: "all", label: "All Categories" },
                    ...categoryOptions.map((cat) => ({ value: cat.slug || "", label: cat.category }))
                  ]}
                  isClearable={false}
                  size="sm"
                  placeholder="All Categories"
                />

                <SearchableSelect
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  options={[
                    { value: "featured", label: "Sort by: Featured" },
                    { value: "name_asc", label: "Name: A to Z" },
                    { value: "price_low", label: "Price: Low to High" },
                    { value: "price_high", label: "Price: High to Low" }
                  ]}
                  isClearable={false}
                  isSearchable={false}
                  size="sm"
                  placeholder="Sort by"
                />

                <button
                  onClick={clearFilters}
                  className="h-11 rounded-xl bg-blue-900 text-xs font-bold text-white transition-all hover:bg-blue-800"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Services Grid */}
        <section className="container mx-auto px-4 py-16">
          {loading && serviceIndex.length === 0 ? (
            <PanelLogoLoader
              className="min-h-[18rem] px-0 py-0"
              label="Loading services..."
              size={60}
            />
          ) : filteredServices.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 py-32 text-center">
              <h3 className="text-2xl font-bold text-slate-900">No services found</h3>
              <p className="mt-2 text-slate-500">Try adjusting your filters or search query.</p>
              <Button variant="outline" onClick={clearFilters} className="mt-6">Clear Filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredServices.map((service) => (
                <Link
                  key={service.id}
                  href={service.destination}
                  className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 transition-all duration-500 hover:-translate-y-2 hover:border-blue-900 hover:shadow-2xl"
                >
                  <div className="absolute right-0 top-0 h-32 w-32 translate-x-12 translate-y-[-12px] rounded-full bg-blue-50/50 transition-transform duration-500 group-hover:scale-150" />
                  
                  <div className="relative">
                    <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-900">
                      <i className={`fas ${service.categoryIcon} text-amber-500`} />
                      {service.categoryName}
                    </div>
                    
                    <h3 className="mt-4 text-xl font-extrabold text-slate-900 group-hover:text-blue-900 leading-tight">{service.name}</h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {service.short_description || service.description || "Expert support for your business compliance and filing needs."}
                    </p>
                    
                    <div className="mt-6 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Starts From</p>
                        <p className="mt-1 text-xl font-extrabold text-blue-900">
                          {service.priceFrom
                            ? `₹${priceFormatter.format(service.priceFrom)}`
                            : "Request Quote"}
                        </p>
                      </div>
                      <div className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center transition-all duration-300 group-hover:bg-blue-900 group-hover:scale-110">
                          <i className="fas fa-arrow-right text-xs"></i>
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
