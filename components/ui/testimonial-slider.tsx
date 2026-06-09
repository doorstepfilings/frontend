"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { TestimonialEntry } from "@/lib/constants/testimonials";
import { cn } from "@/lib/utils";

interface TestimonialSliderProps {
  testimonials: ReadonlyArray<TestimonialEntry>;
}

export function TestimonialSlider({ testimonials }: TestimonialSliderProps) {
  const itemsPerView = 2;
  const hasTestimonials = testimonials.length > 0;
  const groupedTestimonials: TestimonialEntry[][] = [];

  for (let index = 0; index < testimonials.length; index += itemsPerView) {
    groupedTestimonials.push(testimonials.slice(index, index + itemsPerView));
  }

  const hasLoop = groupedTestimonials.length > 1;
  const slides = hasLoop
    ? [
        groupedTestimonials[groupedTestimonials.length - 1],
        ...groupedTestimonials,
        groupedTestimonials[0],
      ]
    : groupedTestimonials;
  const totalSlides = slides.length;
  const totalOriginalGroups = groupedTestimonials.length;
  const transitionDurationMs = 700;

  const [currentIndex, setCurrentIndex] = useState(
    testimonials.length > itemsPerView ? 1 : 0,
  );
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!hasLoop || isPaused || isTransitioning) return;

    const interval = window.setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex >= totalSlides - 1) {
          window.setTimeout(() => {
            setCurrentIndex(1);
            setIsTransitioning(false);
          }, transitionDurationMs);
          return nextIndex;
        }
        return nextIndex;
      });

      window.setTimeout(() => {
        setIsTransitioning(false);
      }, transitionDurationMs);
    }, 4500);

    return () => window.clearInterval(interval);
  }, [hasLoop, isPaused, isTransitioning, totalSlides]);

  useEffect(() => {
    if (!hasLoop) {
      return;
    }

    if (currentIndex === 0) {
      const timer = window.setTimeout(() => {
        setCurrentIndex(totalSlides - 2);
        setIsTransitioning(false);
      }, 50);
      return () => window.clearTimeout(timer);
    }

    if (currentIndex === totalSlides - 1) {
      const timer = window.setTimeout(() => {
        setCurrentIndex(1);
        setIsTransitioning(false);
      }, 50);
      return () => window.clearTimeout(timer);
    }
  }, [currentIndex, hasLoop, totalSlides]);

  const handleNext = () => {
    if (!hasLoop) {
      return;
    }

    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
    setIsPaused(true);

    window.setTimeout(() => {
      setIsTransitioning(false);
    }, transitionDurationMs);
  };

  const handlePrev = () => {
    if (!hasLoop) {
      return;
    }

    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
    setIsPaused(true);

    window.setTimeout(() => {
      setIsTransitioning(false);
    }, transitionDurationMs);
  };

  const getDisplayIndex = () => {
    if (!hasLoop) {
      return 0;
    }

    let idx = currentIndex - 1;
    if (idx < 0) idx = totalOriginalGroups - 1;
    if (idx >= totalOriginalGroups) idx = 0;
    return idx;
  };

  const goToSlide = (slideIndex: number) => {
    if (!hasLoop) {
      return;
    }

    setIsTransitioning(true);
    setIsPaused(true);
    setCurrentIndex(slideIndex + 1);

    window.setTimeout(() => {
      setIsTransitioning(false);
    }, transitionDurationMs);
  };

  const getTransform = () => {
    const slideWidth = 100;
    const offset = -(currentIndex * slideWidth);
    return `translateX(${offset}%)`;
  };

  if (!hasTestimonials) {
    return null;
  }

  return (
    <section className="overflow-hidden  from-gray-50 to-white py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500"></span>
            <span className="text-sm font-semibold uppercase tracking-wider text-amber-600">
              Testimonials
            </span>
          </div>
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            What Our Clients Say
          </h2>
          <p className="text-xl text-gray-600">
            Trusted by 500+ businesses across India
          </p>
        </div>

        <div
          className="relative mx-auto max-w-6xl"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="overflow-hidden rounded-2xl">
            <div
              className="flex"
              style={{
                transform: getTransform(),
                transition: isTransitioning
                  ? "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)"
                  : "none",
              }}
            >
              {slides.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className={cn(
                    "shrink-0 px-2",
                    group.length === 1 && "mx-auto max-w-2xl",
                  )}
                  style={{
                    width: "100%",
                    minWidth: "100%",
                  }}
                >
                  <div
                    className={cn(
                      "grid grid-cols-1 gap-6",
                      group.length > 1 && "md:grid-cols-2",
                    )}
                  >
                    {group.map((testimonial, idx) => (
                      <div
                        key={`${groupIndex}-${idx}`}
                        className="group flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-2xl md:p-8"
                      >
                        <div className="mb-6">
                          <svg
                            className="h-10 w-10 text-amber-200 transition-colors group-hover:text-amber-300"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                          </svg>
                        </div>

                        <p className="mb-6 text-lg italic leading-relaxed text-gray-600">
                          &quot;{testimonial.quote}&quot;
                        </p>

                        <div className="mb-6 flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className="h-5 w-5 fill-current text-amber-400"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>

                        <div className="mt-auto flex items-center gap-4 border-t border-gray-100 pt-6">
                          <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-amber-500/80 bg-slate-100 shadow-md transition-transform duration-300 group-hover:scale-105">
                            <Image
                              src={testimonial.image}
                              alt={testimonial.name}
                              width={72}
                              height={72}
                              sizes="72px"
                              quality={100}
                              style={{ objectPosition: testimonial.imagePosition }}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-gray-900">
                              {testimonial.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {testimonial.designation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {hasLoop ? (
            <>
              <button
                onClick={handlePrev}
                className="group absolute left-0 top-1/2 z-10 flex h-12 w-12 -translate-x-2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white text-blue-900 shadow-xl transition-all duration-300 hover:bg-blue-900 hover:text-white md:-translate-x-6"
                aria-label="Previous slide"
              >
                <svg
                  className="h-5 w-5 transition-transform group-hover:-translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="group absolute right-0 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 translate-x-2 items-center justify-center rounded-full border border-gray-100 bg-white text-blue-900 shadow-xl transition-all duration-300 hover:bg-blue-900 hover:text-white md:translate-x-6"
                aria-label="Next slide"
              >
                <svg
                  className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          ) : null}

          {hasLoop ? (
            <div className="mt-10 flex justify-center gap-3">
              {Array.from({ length: totalOriginalGroups }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    getDisplayIndex() === index
                      ? "w-10 bg-blue-900"
                      : "w-2.5 bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
