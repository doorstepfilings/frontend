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
import { getRoleNavLinks } from "@/lib/auth/nav-links";
import { ServicesMegaMenu } from "@/components/layout/header/services-mega-menu";
import { UserDropdown } from "@/components/layout/header/user-dropdown";
import { MobileMenu } from "@/components/layout/header/mobile-menu";

export function PublicHeader() {
  const dispatch = useAppDispatch();
  const { items: servicesData, status: servicesStatus } = useAppSelector(
    (state) => state.services,
  );

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [mobileServicesExpanded, setMobileServicesExpanded] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [activeServiceTab, setActiveServiceTab] = useState(0);

  const pathname = usePathname();
  const user = useStoredUser();
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const dashboardHref = user ? getDefaultRedirectPath(user) : "/dashboard";
  const normalizedRole = normalizeRole(
    typeof user?.role === "string" ? user.role : null,
  );

  const navLinks = getRoleNavLinks({
    isSuperAdmin: normalizedRole === "super_admin",
    isRegionalManager: normalizedRole === "regional_manager",
    isAccountant: normalizedRole === "accountant",
    showUserPanelLinks:
      normalizedRole !== "super_admin" &&
      normalizedRole !== "regional_manager" &&
      normalizedRole !== "accountant",
    dashboardHref,
  });

  useEffect(() => {
    if (servicesStatus === "idle" && servicesData.length === 0) {
      dispatch(fetchServices());
    }
  }, [dispatch, servicesData.length, servicesStatus]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close all menus on route change
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsMenuOpen(false);
      setServicesDropdownOpen(false);
      setUserDropdownOpen(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  // Close user dropdown on outside click
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

  return (
    <header
      className={`header sticky top-0 z-50 bg-white transition-all duration-300 ${
        isScrolled ? "scrolled shadow-lg" : ""
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Image
              src="/assets/images/logo.png"
              alt="DoorstepFilings"
              width={160}
              height={80}
              className="h-16 w-auto object-contain sm:h-20"
              style={{ width: "auto" }}
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            <Link
              href="/"
              className="px-4 py-2 font-medium text-gray-700 transition-colors hover:text-blue-900"
            >
              Home
            </Link>

            {/* Services dropdown trigger */}
            <div
              className="group relative flex h-full items-center"
              onMouseEnter={() => setServicesDropdownOpen(true)}
              onMouseLeave={() => setServicesDropdownOpen(false)}
            >
              <button
                className={`flex items-center gap-1 px-4 py-2 font-medium transition-colors ${
                  servicesDropdownOpen
                    ? "rounded-lg bg-blue-50/50 text-blue-900"
                    : "text-gray-700 hover:text-blue-900"
                }`}
              >
                Services{" "}
                <i
                  className={`fas fa-chevron-down text-xs transition-transform duration-200 ${
                    servicesDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <ServicesMegaMenu
                servicesData={servicesData}
                activeServiceTab={activeServiceTab}
                isVisible={servicesDropdownOpen}
                onTabChange={setActiveServiceTab}
              />
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

          {/* Desktop action bar */}
          <div className="hidden items-center gap-4 lg:flex">
            <a
              href="mailto:support@doorstepfilings.com"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-all hover:bg-blue-900 hover:text-white"
              title="Email Us"
            >
              <i className="fas fa-envelope" />
            </a>
            <a
              href="https://wa.me/919898196396"
              target="_blank"
              rel="noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-all hover:bg-green-500 hover:text-white"
              title="WhatsApp"
            >
              <i className="fab fa-whatsapp" />
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
                        {normalizedRole === "regional_manager"
                          ? "Relationship Manager"
                          : normalizedRole.replace(/_/g, " ")}
                      </p>
                    </div>
                    <i
                      className={`fas fa-chevron-down text-xs text-gray-400 transition-transform ${
                        userDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <UserDropdown
                    user={user}
                    isOpen={userDropdownOpen}
                    normalizedRole={normalizedRole}
                    navLinks={navLinks}
                    onClose={() => setUserDropdownOpen(false)}
                    onLogout={() => void handleLogout()}
                  />
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

          {/* Hamburger */}
          <button
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            <span
              className={`h-0.5 w-6 bg-gray-800 transition-all ${
                isMenuOpen ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`h-0.5 w-6 bg-gray-800 transition-all ${
                isMenuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`h-0.5 w-6 bg-gray-800 transition-all ${
                isMenuOpen ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      <MobileMenu
        isOpen={isMenuOpen}
        servicesData={servicesData}
        servicesExpanded={mobileServicesExpanded}
        onServicesToggle={() => setMobileServicesExpanded(!mobileServicesExpanded)}
        user={user}
        navLinks={navLinks}
        onLogout={() => void handleLogout()}
      />
    </header>
  );
}
