"use client";

import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchServices } from "@/lib/features/services/services-slice";
import { apiClient } from "@/lib/api/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ContactFloatingButton() {
  const dispatch = useAppDispatch();
  const { items: servicesData } = useAppSelector((state) => state.services);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && (!servicesData || servicesData.length === 0)) {
      dispatch(fetchServices());
    }
  }, [isOpen, servicesData, dispatch]);

  const allServices = Array.isArray(servicesData)
    ? servicesData.flatMap((category) => category.services || [])
    : [];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiClient.post("/enquiries", formData);
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", service: "", message: "" });
      setTimeout(() => {
        setSubmitted(false);
        setIsOpen(false);
      }, 3000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger 
        render={
          <button
            className="group fixed right-0 top-1/2 z-50 flex h-16 w-14 -translate-y-1/2 cursor-pointer items-center overflow-hidden rounded-l-2xl border border-r-0 border-white/20 bg-blue-900 text-white shadow-2xl transition-all duration-300 hover:w-48 hover:bg-amber-500"
            aria-label="Open Contact Form"
          />
        }
      >
        <div className="relative flex h-full w-14 min-w-[3.5rem] items-center justify-center bg-white/10">
          <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100"></div>
          <i className="fas fa-headset text-2xl transition-transform group-hover:scale-110"></i>
        </div>
        <span className="whitespace-nowrap pl-3 font-bold tracking-wide opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          Get in Touch
        </span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Get Expert Consultation</DialogTitle>
        </DialogHeader>

        <div className="bg-white">
          {submitted ? (
            <div className="animate-fadeIn rounded-xl border border-green-200 bg-green-50 p-6 text-center text-green-800">
              <i className="fas fa-check-circle mb-4 text-4xl"></i>
              <h4 className="mb-2 text-lg font-bold">Thank You!</h4>
              <p className="text-sm">
                Your message was sent successfully. We&apos;ll get back to you soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="mb-4 text-sm text-gray-500">
                Fill out the form below and our experts will contact you
                shortly.
              </p>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-900"
                  placeholder="Enter your name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-900"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-900"
                    placeholder="+91..."
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Service Related to
                </label>
                <select
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-900"
                >
                  <option value="">Select a service</option>
                  {allServices.map((service, idx) => (
                    <option key={idx} value={service.name}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-900"
                  placeholder="How can we help you?"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-900 py-3 text-sm font-bold text-white transition-colors hover:bg-amber-500 ${
                  loading ? "cursor-not-allowed opacity-70" : ""
                }`}
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-3 border-white border-t-transparent"></div>
                ) : (
                  <i className="fas fa-paper-plane"></i>
                )}
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
