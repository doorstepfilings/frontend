import Link from "next/link";
import type { ServiceCategory } from "@/lib/features/services/types";
import type { AuthUser } from "@/lib/auth/types";
import type { NavLinkItem } from "@/lib/auth/nav-links";

interface MobileMenuProps {
  isOpen: boolean;
  servicesData: ServiceCategory[];
  servicesExpanded: boolean;
  onServicesToggle: () => void;
  user: AuthUser | null;
  navLinks: NavLinkItem[];
  onLogout: () => void;
}

export function MobileMenu({
  isOpen,
  servicesData,
  servicesExpanded,
  onServicesToggle,
  user,
  navLinks,
  onLogout,
}: MobileMenuProps) {
  return (
    <div
      className={`border-t bg-white transition-all duration-300 lg:hidden ${
        isOpen ? "max-h-screen opacity-100" : "max-h-0 overflow-hidden opacity-0"
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

          {/* Services accordion */}
          <div>
            <button
              onClick={onServicesToggle}
              className="flex w-full items-center justify-between rounded-lg px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
            >
              Services{" "}
              <i
                className={`fas fa-chevron-down transition-transform ${
                  servicesExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all ${
                servicesExpanded ? "max-h-[600px] overflow-y-auto" : "max-h-0"
              }`}
            >
              {Array.isArray(servicesData) &&
                servicesData.map((category, catIdx) => (
                  <div
                    key={catIdx}
                    className="my-2 ml-4 border-l-2 border-amber-500 px-4 py-3"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <i className={`fas ${category.icon} text-sm text-amber-500`} />
                      <h4 className="text-sm font-bold text-blue-900">{category.category}</h4>
                    </div>
                    <ul className="space-y-1 pl-2">
                      {category.services?.map((service, sIdx) => (
                        <li key={sIdx}>
                          <Link
                            href={service.link || `/service/${service.slug}`}
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

          {/* Auth section */}
          <div className="mt-2 border-t border-gray-100 pt-4">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-4 py-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-900">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-gray-700">Hello, {user.name}</span>
                </div>

                <div className="space-y-1 rounded-xl bg-gray-50 p-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href + link.label}
                      href={link.href}
                      className={`flex items-center gap-3 rounded-lg bg-white px-4 py-3 font-medium text-gray-700 shadow-sm transition-colors ${link.hoverBg} ${link.hoverText}`}
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${link.iconBg}`}
                      >
                        <i className={`fas ${link.icon}`} />
                      </div>
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </div>

                <button
                  onClick={onLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-200 px-4 py-3 font-semibold text-red-600 transition-all hover:border-red-500 hover:bg-red-500 hover:text-white"
                >
                  <i className="fas fa-sign-out-alt" /> Logout
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
  );
}
