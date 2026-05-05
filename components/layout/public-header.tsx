"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchServices } from "@/lib/features/services/services-slice";
import { normalizeRole } from "@/lib/auth/redirects";
import { clearStoredAuth, getDefaultRedirectPath } from "@/lib/auth/storage";
import { useStoredUser } from "@/lib/auth/hooks";

export function PublicHeader() {
  const dispatch = useAppDispatch();
  const { items: servicesData } = useAppSelector((state) => state.services);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [activeServiceTab, setActiveServiceTab] = useState(0);

  const pathname = usePathname();
  const user = useStoredUser();
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const dashboardHref = user ? getDefaultRedirectPath(user) : "/dashboard";
  const normalizedRole = normalizeRole(
    typeof user?.role === "string" ? user.role : null,
  );
  const isSuperAdmin = normalizedRole === "super_admin";
  const isRegionalManager = normalizedRole === "regional_manager";
  const isAccountant = normalizedRole === "accountant";
  const showUserPanelLinks = !isSuperAdmin && !isRegionalManager && !isAccountant;

  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsMenuOpen(false);
      setActiveDropdown(null);
      setUserDropdownOpen(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(e.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await clearStoredAuth();
    window.location.href = "/login";
  };

  const toggleDropdown = (idx: number) =>
    setActiveDropdown(activeDropdown === idx ? null : idx);

  return (
    <header
      className={`header sticky top-0 z-50 bg-white transition-all duration-300 ${
        isScrolled ? "scrolled shadow-lg" : ""
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/assets/images/logo.png"
              alt="DoorstepFilings"
              width={160}
              height={80}
              className="h-20 w-auto object-contain"
            />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            <Link
              href="/"
              className="px-4 py-2 font-medium text-gray-700 transition-colors hover:text-blue-900"
            >
              Home
            </Link>
            <div
              className="group relative flex h-full items-center"
              onMouseEnter={() => setActiveDropdown(0)}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                className={`flex items-center gap-1 px-4 py-2 font-medium transition-colors ${
                  activeDropdown === 0
                    ? "rounded-lg bg-blue-50/50 text-blue-900"
                    : "text-gray-700 hover:text-blue-900"
                }`}
              >
                Services{" "}
                <i
                  className={`fas fa-chevron-down text-xs transition-transform duration-200 ${
                    activeDropdown === 0 ? "rotate-180" : ""
                  }`}
                ></i>
              </button>
              <div
                className={`absolute left-1/2 top-full w-[1000px] -translate-x-1/2 overflow-hidden rounded-2xl border border-gray-100/50 bg-white shadow-xl shadow-blue-900/10 transition-all duration-300 ${
                  activeDropdown === 0
                    ? "visible translate-y-2 opacity-100"
                    : "invisible translate-y-4 opacity-0"
                }`}
              >
                <div className="flex min-h-[450px]">
                  <div className="w-72 border-r border-gray-100 bg-gray-50/50 py-6">
                    <div className="mb-4 px-6">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                        Service Categories
                      </h3>
                    </div>
                    <div className="flex flex-col">
                      {Array.isArray(servicesData) &&
                        servicesData.map((category, idx) => (
                          <button
                            key={idx}
                            onMouseEnter={() => setActiveServiceTab(idx)}
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
                                <i className={`fas ${category.icon} text-sm`}></i>
                              </div>
                              <span className="text-[13px] font-semibold">
                                {category.category}
                              </span>
                            </div>
                            <i
                              className={`fas fa-chevron-right text-xs transition-all ${
                                activeServiceTab === idx
                                  ? "translate-x-0 text-amber-500 opacity-100"
                                  : "-translate-x-2 opacity-0"
                              }`}
                            ></i>
                          </button>
                        ))}
                    </div>
                  </div>
                  <div className="relative flex-1 bg-white p-8">
                    {Array.isArray(servicesData) &&
                      servicesData[activeServiceTab] && (
                        <div className="animate-fade-in">
                          <div className="mb-8 flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                              <h3 className="mb-1 flex items-center gap-2 text-xl font-bold text-blue-900">
                                {servicesData[activeServiceTab].category}
                                <span className="rounded-full border border-gray-100 bg-gray-50 px-2 py-0.5 text-xs font-normal text-gray-400">
                                  {
                                    servicesData[activeServiceTab].services
                                      ?.length
                                  }{" "}
                                  Services
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
                              <i className="fas fa-arrow-right text-xs transition-transform group-hover/link:translate-x-1"></i>
                            </Link>
                          </div>
                          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            {servicesData[activeServiceTab].services?.map(
                              (service, sIdx) => (
                                <Link
                                  key={sIdx}
                                  href={service.link || `/service/${service.slug}`}
                                  className="group/item flex items-start gap-3 rounded-xl border border-transparent p-3 transition-all duration-200 hover:border-blue-50 hover:bg-blue-50/30"
                                >
                                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-300 transition-colors group-hover/item:bg-amber-500"></div>
                                  <div>
                                    <h4 className="mb-0.5 text-sm font-bold text-gray-700 transition-colors group-hover/item:text-blue-900">
                                      {service.name}
                                    </h4>
                                    <p className="line-clamp-1 text-xs text-gray-400 transition-colors group-hover/item:text-blue-400/80">
                                      {service.short_description ||
                                        "Expert financial solutions"}
                                    </p>
                                  </div>
                                  <i className="fas fa-external-link-alt ml-auto mt-1 text-[10px] text-gray-300 opacity-0 transition-opacity group-hover/item:opacity-100"></i>
                                </Link>
                              )
                            )}
                          </div>
                          <div className="mt-8 flex items-center justify-between rounded-xl border border-blue-50 bg-gradient-to-r from-blue-50 to-transparent p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                                <i className="fas fa-headset"></i>
                              </div>
                              <div>
                                <h5 className="text-sm font-bold text-blue-900">
                                  Need specific help with{" "}
                                  {servicesData[activeServiceTab].category}?
                                </h5>
                                <p className="text-xs text-gray-500">
                                  Our experts are ready to assist you.
                                </p>
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
            </div>
            <Link
              href="/about"
              className="px-4 py-2 font-medium text-gray-700 transition-colors hover:text-blue-900"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="px-4 py-2 font-medium text-gray-700 transition-colors hover:text-blue-900"
            >
              Contact
            </Link>
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <a
              href="mailto:support@doorstepfilings.com"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-all hover:bg-blue-900 hover:text-white"
              title="Email Us"
            >
              <i className="fas fa-envelope"></i>
            </a>
            <a
              href="https://wa.me/919898196396"
              target="_blank"
              rel="noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-all hover:bg-green-500 hover:text-white"
              title="WhatsApp"
            >
              <i className="fab fa-whatsapp"></i>
            </a>
            <div
              className="ml-2 flex items-center gap-2 border-l border-gray-200 pl-6"
              ref={userDropdownRef}
            >
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-all ${
                      userDropdownOpen
                        ? "bg-blue-50 ring-1 ring-blue-100"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-900 text-sm font-bold text-white">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden text-left xl:block">
                      <p className="text-sm font-semibold leading-tight text-gray-800">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {normalizedRole.replace(/_/g, " ")}
                      </p>
                    </div>
                    <i
                      className={`fas fa-chevron-down text-xs text-gray-400 transition-transform ${
                        userDropdownOpen ? "rotate-180" : ""
                      }`}
                    ></i>
                  </button>
                  <div
                    className={`absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-gray-100 bg-white py-2 shadow-lg transition-all duration-200 ${
                      userDropdownOpen
                        ? "visible translate-y-0 opacity-100"
                        : "invisible -translate-y-2 opacity-0"
                    }`}
                  >
                    <div className="border-b border-gray-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {user.email}
                      </p>
                    </div>
                    <div className="py-2">
                      {isSuperAdmin && (
                        <Link
                          href={dashboardHref}
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-900"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                            <i className="fas fa-chart-line text-sm text-blue-600"></i>
                          </div>
                          <span className="text-sm font-medium">
                            Admin Dashboard
                          </span>
                        </Link>
                      )}
                      {isAccountant && (
                        <Link
                          href={dashboardHref}
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 transition-colors hover:bg-emerald-50 hover:text-emerald-900"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                            <i className="fas fa-calculator text-sm text-emerald-600"></i>
                          </div>
                          <span className="text-sm font-medium">
                            Accountant Dashboard
                          </span>
                        </Link>
                      )}
                      {isRegionalManager && (
                        <Link
                          href={dashboardHref}
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 transition-colors hover:bg-indigo-50 hover:text-indigo-900"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                            <i className="fas fa-user-tie text-sm text-indigo-600"></i>
                          </div>
                          <span className="text-sm font-medium">
                            RM Dashboard
                          </span>
                        </Link>
                      )}
                      {showUserPanelLinks && (
                        <>
                          <Link
                            href="/dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-900"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                              <i className="fas fa-th-large text-sm text-blue-600"></i>
                            </div>
                            <span className="text-sm font-medium">
                              My Dashboard
                            </span>
                          </Link>
                          <Link
                            href="/dashboard/services"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-900"
                          >
                            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                              <i className="fas fa-clipboard-list text-sm text-amber-600"></i>
                            </div>
                            <span className="text-sm font-medium">
                              My Services
                            </span>
                          </Link>
                          <Link
                            href="/account"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-900"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                              <i className="fas fa-user text-sm text-blue-600"></i>
                            </div>
                            <span className="text-sm font-medium">
                              My Account
                            </span>
                          </Link>
                        </>
                      )}
                    </div>
                    <div className="border-t border-gray-100 pt-2">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          void handleLogout();
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-red-600 transition-colors hover:bg-red-50"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                          <i className="fas fa-sign-out-alt text-sm text-red-500"></i>
                        </div>
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-lg border border-blue-900 px-5 py-2 font-medium text-blue-900 transition-all hover:bg-blue-900 hover:text-white"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg bg-blue-900 px-5 py-2 font-medium text-white transition-all hover:bg-amber-500"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>

          <button
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            <span
              className={`h-0.5 w-6 bg-gray-800 transition-all ${
                isMenuOpen ? "translate-y-2 rotate-45" : ""
              }`}
            ></span>
            <span
              className={`h-0.5 w-6 bg-gray-800 transition-all ${
                isMenuOpen ? "opacity-0" : ""
              }`}
            ></span>
            <span
              className={`h-0.5 w-6 bg-gray-800 transition-all ${
                isMenuOpen ? "-translate-y-2 -rotate-45" : ""
              }`}
            ></span>
          </button>
        </div>
      </div>

      <div
        className={`border-t bg-white transition-all duration-300 lg:hidden ${
          isMenuOpen ? "max-h-screen opacity-100" : "max-h-0 overflow-hidden opacity-0"
        }`}
      >
        <div className="container mx-auto px-4 py-4">
          <nav className="flex flex-col gap-2">
            <Link
              href="/"
              className="rounded-lg px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              Home
            </Link>
            <div>
              <button
                onClick={() => toggleDropdown(0)}
                className="flex w-full items-center justify-between rounded-lg px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
              >
                Services{" "}
                <i
                  className={`fas fa-chevron-down transition-transform ${
                    activeDropdown === 0 ? "rotate-180" : ""
                  }`}
                ></i>
              </button>
              <div
                className={`overflow-hidden transition-all ${
                  activeDropdown === 0
                    ? "max-h-[600px] overflow-y-auto"
                    : "max-h-0"
                }`}
              >
                {Array.isArray(servicesData) &&
                  servicesData.map((category, catIdx) => (
                    <div
                      key={catIdx}
                      className="my-2 ml-4 border-l-2 border-amber-500 px-4 py-3"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <i
                          className={`fas ${category.icon} text-sm text-amber-500`}
                        ></i>
                        <h4 className="text-sm font-bold text-blue-900">
                          {category.category}
                        </h4>
                      </div>
                      <ul className="space-y-1 pl-2">
                        {category.services?.map((service, sIdx) => (
                          <li key={sIdx}>
                            <Link
                              href={
                                service.link || `/service/${service.slug}`
                              }
                              className="block py-1 text-xs text-gray-600 hover:text-blue-900"
                            >
                              {service.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </div>
            <Link
              href="/about"
              className="rounded-lg px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="rounded-lg px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              Contact
            </Link>
            <div className="mt-2 border-t border-gray-100 pt-4">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 px-4 py-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-900">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-gray-700">
                      Hello, {user.name}
                    </span>
                  </div>
                  <div className="space-y-1 rounded-xl bg-gray-50 p-2">
                    {isSuperAdmin && (
                      <Link
                        href={dashboardHref}
                        className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 font-medium text-gray-700 shadow-sm transition-colors hover:bg-blue-50 hover:text-blue-900"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                          <i className="fas fa-chart-line text-blue-600"></i>
                        </div>
                        <span>Admin Dashboard</span>
                      </Link>
                    )}
                    {isAccountant && (
                      <Link
                        href={dashboardHref}
                        className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 font-medium text-gray-700 shadow-sm transition-colors hover:bg-emerald-50 hover:text-emerald-900"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                          <i className="fas fa-calculator text-emerald-600"></i>
                        </div>
                        <span>Accountant Dashboard</span>
                      </Link>
                    )}
                    {isRegionalManager && (
                      <Link
                        href={dashboardHref}
                        className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 font-medium text-gray-700 shadow-sm transition-colors hover:bg-indigo-50 hover:text-indigo-900"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
                          <i className="fas fa-user-tie text-indigo-600"></i>
                        </div>
                        <span>RM Dashboard</span>
                      </Link>
                    )}
                    {showUserPanelLinks && (
                      <>
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 font-medium text-gray-700 shadow-sm transition-colors hover:bg-blue-50 hover:text-blue-900"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                            <i className="fas fa-th-large text-blue-600"></i>
                          </div>
                          <span>My Dashboard</span>
                        </Link>
                        <Link
                          href="/dashboard/services"
                          className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 font-medium text-gray-700 shadow-sm transition-colors hover:bg-blue-50 hover:text-blue-900"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                            <i className="fas fa-clipboard-list text-amber-600"></i>
                          </div>
                          <span>My Services</span>
                        </Link>
                        <Link
                          href="/account"
                          className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 font-medium text-gray-700 shadow-sm transition-colors hover:bg-blue-50 hover:text-blue-900"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                            <i className="fas fa-user text-blue-600"></i>
                          </div>
                          <span>My Account</span>
                        </Link>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => void handleLogout()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-200 px-4 py-3 font-semibold text-red-600 transition-all hover:border-red-500 hover:bg-red-500 hover:text-white"
                  >
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Link
                    href="/login"
                    className="flex-1 rounded-lg border border-blue-900 px-4 py-3 text-center font-medium text-blue-900"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1 rounded-lg bg-blue-900 px-4 py-3 text-center font-medium text-white"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
