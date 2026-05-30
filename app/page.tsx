"use client";

import { useEffect, useState } from "react";
import { TestimonialSlider } from "@/components/ui/testimonial-slider";
import { homeTestimonials } from "@/lib/constants/testimonials";
import { fetchServices } from "@/lib/features/services/services-slice";
import type { ServiceCategory } from "@/lib/features/services/types";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { PublicShell } from "@/components/layout/public-shell";
import { HomeHero } from "@/components/home/home-hero";
import { HomeStats } from "@/components/home/home-stats";
import { HomeServices } from "@/components/home/home-services";
import { HomeCta } from "@/components/home/home-cta";

export default function HomePage() {
  const dispatch = useAppDispatch();
  const { items: servicesData, status, error } = useAppSelector(
    (state) => state.services,
  );
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    if (status === "idle" && servicesData.length === 0) {
      dispatch(fetchServices());
    }
  }, [dispatch, servicesData.length, status]);

  const selectedTab = activeTab || servicesData[0]?.slug || "";
  const activeCategory: ServiceCategory | undefined =
    servicesData.find((c) => c.slug === selectedTab) ?? servicesData[0];

  return (
    <PublicShell>
      <div className="font-sans text-gray-800">
        <HomeHero />
        <HomeStats />
        <HomeServices
          servicesData={servicesData}
          status={status}
          error={error}
          selectedTab={selectedTab}
          activeCategory={activeCategory}
          onTabChange={setActiveTab}
        />
        <HomeCta />
        <TestimonialSlider testimonials={homeTestimonials} />

        {/* Industry trust strip */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-4 text-center">
            <p className="mb-8 text-sm font-bold uppercase tracking-widest text-gray-400">
              Trusted by industry leaders across sectors
            </p>
            <div className="flex flex-wrap items-center justify-center gap-12 opacity-50 grayscale transition-all duration-500 hover:grayscale-0">
              <i className="fas fa-building text-5xl hover:text-blue-900" />
              <i className="fas fa-landmark text-5xl hover:text-blue-900" />
              <i className="fas fa-hospital text-5xl hover:text-blue-900" />
              <i className="fas fa-industry text-5xl hover:text-blue-900" />
              <i className="fas fa-shopping-cart text-5xl hover:text-blue-900" />
            </div>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
