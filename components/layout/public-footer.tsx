"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useAppSelector } from "@/lib/store/hooks";
import { CONTACT, SITE } from "@/lib/constants/site";

export function PublicFooter() {
  const { items: servicesData } = useAppSelector((state) => state.services);

  return (
    <footer className="bg-gray-900 pb-8 pt-16 text-white">
      <div className="container mx-auto px-4">
        <div className="mb-12 rounded-2xl bg-gradient-to-r from-blue-800 to-indigo-900 p-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div>
              <h3 className="mb-2 text-2xl font-bold">
                Subscribe Our Newsletter
              </h3>
              <p className="text-blue-200">
                Stay updated with latest tax laws and financial updates.
              </p>
            </div>
            <form className="flex w-full flex-col items-center gap-3 sm:flex-row md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500 sm:w-64"
              />

              <button
                type="submit"
                className="w-full rounded-lg bg-amber-500 px-6 py-3 font-semibold text-white shadow-md transition-all duration-200 hover:bg-amber-600 hover:shadow-lg sm:w-auto"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link
              href="/"
              className="mb-6 inline-block rounded-xl bg-white px-4 py-2"
            >
              <Image
                src="/assets/images/logo.png"
                alt={SITE.name}
                width={132}
                height={56}
                className="h-14 w-auto object-contain"
              />
            </Link>
            <p className="mb-6 text-sm text-gray-400">
              Complete Financial, Tax, And Advisory Solutions under one roof.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 transition-colors hover:bg-blue-600"
              >
                <i className="fab fa-facebook-f"></i>
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 transition-colors hover:bg-blue-600"
              >
                <i className="fab fa-twitter"></i>
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 transition-colors hover:bg-blue-600"
              >
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
          </div>
          <div>
            <h4 className="mb-6 text-lg font-bold text-amber-500">
              Our Services
            </h4>
            <ul className="space-y-3">
              {servicesData && servicesData.length > 0 ? (
                servicesData.slice(0, 5).map((category, idx) => (
                  <li key={idx}>
                    <Link
                      href="/services"
                      className="text-gray-400 transition-colors hover:text-white"
                    >
                      {category.category}
                    </Link>
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <Link
                      href="/services"
                      className="text-gray-400 transition-colors hover:text-white"
                    >
                      Project Finance
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/services"
                      className="text-gray-400 transition-colors hover:text-white"
                    >
                      GST Services
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/services"
                      className="text-gray-400 transition-colors hover:text-white"
                    >
                      Income Tax
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/services"
                      className="text-gray-400 transition-colors hover:text-white"
                    >
                      Advisory Services
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/services"
                      className="text-gray-400 transition-colors hover:text-white"
                    >
                      Company Law
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
          <div>
            <h4 className="mb-6 text-lg font-bold text-amber-500">
              Quick Links
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/confidentiality-policy"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Confidentiality Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/refund-policy"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/disclaimer-policy"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Disclaimer Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-6 text-lg font-bold text-amber-500">
              Contact Us
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <i className="fas fa-map-marker-alt mt-1 text-blue-500"></i>
                <span className="text-sm text-gray-400">
                  A/639, Sun WestBank
                  <br />
                  Nr. Shiv Cinema, Ashram Road
                  <br />
                  Navrangpura, Ahmedabad - 380009
                </span>
              </li>

              <li className="flex items-center gap-3">
                <i className="fas fa-phone text-blue-500"></i>
                <a
                  href={`tel:${CONTACT.phoneAlt.replace(/\s/g, "")}`}
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  {CONTACT.phoneAlt}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-envelope text-blue-500"></i>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="text-sm text-gray-400 transition-colors hover:text-white"
                >
                  {CONTACT.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col items-center justify-center gap-4 text-center md:flex-row">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} {SITE.name}. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
