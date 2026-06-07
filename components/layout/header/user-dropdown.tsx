import Link from "next/link";
import type { NavLinkItem } from "@/lib/auth/nav-links";
import type { AuthUser } from "@/lib/auth/types";

interface UserDropdownProps {
  user: AuthUser;
  isOpen: boolean;
  normalizedRole: string;
  navLinks: NavLinkItem[];
  onClose: () => void;
  onLogout: () => void;
}

export function UserDropdown({
  user,
  isOpen,
  normalizedRole,
  navLinks,
  onClose,
  onLogout,
}: UserDropdownProps) {
  return (
    <div
      className={`absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-gray-100 bg-white py-2 shadow-lg transition-all duration-200 ${
        isOpen
          ? "visible translate-y-0 opacity-100"
          : "invisible -translate-y-2 opacity-0"
      }`}
    >
      {/* User info header */}
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="truncate text-sm font-semibold text-gray-800">{user.name}</p>
        <p className="truncate text-xs text-gray-500">{user.email}</p>
      </div>

      {/* Nav links */}
      <div className="py-2">
        {navLinks.map((link) => (
          <Link
            key={link.href + link.label}
            href={link.href}
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-2.5 text-gray-700 transition-colors ${link.hoverBg} ${link.hoverText}`}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${link.iconBg}`}>
              <i className={`fas ${link.icon} text-sm`} style={{ color: "inherit" }} />
            </div>
            <span className="text-sm font-medium">{link.label}</span>
          </Link>
        ))}
      </div>

      {/* Logout */}
      <div className="border-t border-gray-100 pt-2">
        <button
          onClick={() => {
            onClose();
            onLogout();
          }}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-red-600 transition-colors hover:bg-red-50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
            <i className="fas fa-sign-out-alt text-sm text-red-500" />
          </div>
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
