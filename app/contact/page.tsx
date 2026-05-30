"use client";

import React, { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchServices } from "@/lib/features/services/services-slice";
import { PublicShell } from "@/components/layout/public-shell";

export default function ContactPage() {
  const dispatch = useAppDispatch();
  const { items: servicesData } = useAppSelector((state) => state.services);

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
    window.scrollTo(0, 0);
    if (!servicesData || servicesData.length === 0) {
      dispatch(fetchServices());
    }
  }, [dispatch, servicesData]);

  // Flatten services from all categories into a single array of names
  let dynamicServices = Array.isArray(servicesData)
    ? servicesData.flatMap((category) => category.services || []).map(s => s.name)
    : [];

  if (dynamicServices.length === 0) {
    dynamicServices = [
      "Project Finance & Loans",
      "MSME Government Grants & Subsidies",
      "Direct Tax Consultancy",
      "GST Services",
      "Advisory & Assurance",
      "Company Law & Secretarial",
      "Management Consultancy",
      "Investment & Insurance Advisory",
      "Accounting & Bookkeeping",
      "Other",
    ];
  } else if (!dynamicServices.includes("Other")) {
    dynamicServices.push("Other");
  }

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
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicShell>
      <div className="min-h-screen bg-gray-50 pt-20">
        {/* Header / Hero Section */}
        <div className="bg-blue-900 py-16 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">Contact Us</h1>
            <p className="text-xl text-blue-200">
              Get in touch with our expert team
            </p>
          </div>
        </div>

        <section className="px-4 py-16 md:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 md:grid-cols-2">
              {/* Contact Info */}
              <div>
                <h2 className="mb-6 text-3xl font-bold text-gray-900">
                  Let&apos;s Discuss Your Requirements
                </h2>
                <p className="mb-8 text-lg text-gray-600">
                  Whether you need assistance with taxation, compliance, or
                  financial advisory, our team is here to help. Reach out to us
                  for a free consultation.
                </p>

                {/* Contact Cards */}
                <div className="space-y-6">
                  <div className="flex items-start gap-4 rounded-xl bg-white p-6 shadow-sm">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                      <i className="fas fa-map-marker-alt text-xl text-blue-900"></i>
                    </div>
                    <div>
                      <h3 className="mb-1 font-bold text-gray-900">
                        Office Address
                      </h3>
                      <p className="text-gray-600">
                        A/639, Sun WestBank
                        <br />
                        Nr. Shiv Cinema, Ashram Road
                        <br />
                        Navrangpura, Ahmedabad - 380009
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-xl bg-white p-6 shadow-sm">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-100">
                      <i className="fas fa-phone-alt text-xl text-green-700"></i>
                    </div>
                    <div>
                      <h3 className="mb-1 font-bold text-gray-900">
                        Phone Numbers
                      </h3>
                      <p className="text-gray-600">
                        <a
                          href="tel:+919898196396"
                          className="hover:text-blue-900"
                        >
                          +91 9898 196 396
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-xl bg-white p-6 shadow-sm">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                      <i className="fas fa-envelope text-xl text-amber-700"></i>
                    </div>
                    <div>
                      <h3 className="mb-1 font-bold text-gray-900">
                        Email Address
                      </h3>
                      <p className="text-gray-600">
                        <a
                          href="mailto:support@doorstepfilings.com"
                          className="hover:text-blue-900"
                        >
                          support@doorstepfilings.com
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-xl bg-white p-6 shadow-sm">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-100">
                      <i className="fas fa-headset text-xl text-purple-700"></i>
                    </div>

                    <div>
                      <h3 className="mb-1 font-bold text-gray-900">
                        Support & Help Desk
                      </h3>

                      <p className="text-gray-600">
                        <a
                          href="mailto:info@doorstepfilings.com"
                          className="hover:text-blue-900"
                        >
                          info@doorstepfilings.com
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Business Hours */}
                <div className="mt-8 rounded-xl bg-blue-900 p-6 text-white">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
                    <i className="far fa-clock"></i>
                    Business Hours
                  </h3>
                  <div className="space-y-2 text-blue-100">
                    <div className="flex justify-between">
                      <span>Monday - Friday</span>
                      <span>10:00 AM - 7:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday</span>
                      <span>10:00 AM - 4:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sunday</span>
                      <span>Closed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="rounded-2xl bg-white p-8 shadow-xl md:p-10">
                <h3 className="mb-6 text-2xl font-bold text-gray-900">
                  Send Us a Message
                </h3>

                {submitted ? (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center text-green-800">
                    <i className="fas fa-check-circle mb-4 text-4xl"></i>
                    <h4 className="mb-2 text-lg font-bold">Thank You!</h4>
                    <p>
                      Your message has been sent successfully. We&apos;ll get back to
                      you soon.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                      </div>
                    )}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-900"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-900"
                          placeholder="your@email.com"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-900"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Service Required
                      </label>
                      <select
                        name="service"
                        value={formData.service}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-900"
                      >
                        <option value="">Select a service</option>
                        {dynamicServices.map((service, idx) => (
                          <option key={idx} value={service}>
                            {service}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Your Message *
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-900"
                        placeholder="Tell us about your requirements..."
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className={`flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-4 text-lg font-bold text-white transition-colors hover:bg-amber-600 ${loading ? "cursor-not-allowed opacity-70" : ""
                        }`}
                    >
                      {loading ? (
                        <div className="h-6 w-6 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                      ) : (
                        <i className="fas fa-paper-plane"></i>
                      )}
                      {loading ? "Sending..." : "Send Message"}
                    </button>

                    <p className="text-center text-xs text-gray-500">
                      By submitting this form, you agree to our privacy policy.
                    </p>
                  </form>
                )}
              </div>
            </div>

            {/* Map Section */}
            <div className="mb-8 mt-16">
              <h3 className="mb-6 text-center text-2xl font-bold text-gray-900">
                Find Us on Map
              </h3>
              <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3671.564362251!2d72.5673!3d23.0360!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDAyJzA5LjYiTiA3MsKwMzQnMDIuMyJF!5e0!3m2!1sen!2sin!4v1234567890"
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Office Location"
                  className="w-full"
                ></iframe>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
