import { useDeferredValue, useMemo } from "react";
import type { IconType } from "react-icons";
import * as FaIcons from "react-icons/fa6";

export type IconRegistryEntry = {
  value: string;
  name: string;
  label: string;
  component: IconType;
  keywords: string[];
};

export const DEFAULT_ICON_NAME = "fa-briefcase";

const LEGACY_ICON_COMPAT_MAP: Record<string, string> = {
  "fa-briefcase": "FaBriefcase",
  "fa-file-invoice": "FaFileInvoice",
  "fa-landmark": "FaLandmark",
  "fa-user-tie": "FaUserTie",
  "fa-building": "FaBuilding",
  "fa-shield-halved": "FaShieldHalved",
  "fa-calculator": "FaCalculator",
  "fa-stamp": "FaStamp",
  "fa-balance-scale": "FaScaleBalanced",
  "fa-chart-pie": "FaChartPie",
  "fa-hand-holding-dollar": "FaHandHoldingDollar",
  "fa-file-contract": "FaFileContract",
  "fa-gavel": "FaGavel",
  "fa-globe": "FaGlobe",
  "fa-users-gear": "FaUsersGear",
  "fa-file-shield": "FaFileShield",
};

const ICON_SEARCH_ALIASES: Partial<Record<string, string[]>> = {
  "fa-briefcase": ["business", "office", "service", "corporate"],
  "fa-file-invoice": ["billing", "tax", "invoice", "documents", "gst"],
  "fa-landmark": ["government", "registration", "authority", "legal"],
  "fa-user-tie": ["advisory", "consulting", "expert", "professional"],
  "fa-building": ["company", "office", "entity", "corporate"],
  "fa-shield-halved": ["security", "protection", "compliance", "safety"],
  "fa-calculator": ["finance", "tax", "gst", "accounting", "itr"],
  "fa-stamp": ["approval", "seal", "certification", "registration"],
  "fa-balance-scale": ["legal", "law", "justice", "compliance"],
  "fa-chart-pie": ["analytics", "report", "finance", "dashboard"],
  "fa-hand-holding-dollar": ["funding", "grant", "investment", "finance"],
  "fa-file-contract": ["agreement", "contract", "legal", "documents"],
  "fa-gavel": ["legal", "court", "law", "compliance"],
  "fa-globe": ["international", "export", "import", "global"],
  "fa-users-gear": ["operations", "team", "support", "workflow"],
  "fa-file-shield": ["secure", "compliance", "audit", "documents"],
};

function formatIconLabel(name: string) {
  const withoutPrefix = name.replace(/^FaReg/, "").replace(/^Fa/, "");
  return withoutPrefix
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim();
}

function createKeywords(value: string, name: string, label: string) {
  const labelTokens = label
    .toLowerCase()
    .split(/[\s/]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  return Array.from(
    new Set([
      value.toLowerCase(),
      name.toLowerCase(),
      ...labelTokens,
      ...(ICON_SEARCH_ALIASES[value] ?? []),
    ]),
  );
}

const ICON_REGISTRY: IconRegistryEntry[] = Object.entries(LEGACY_ICON_COMPAT_MAP)
  .map(([value, name]) => {
    const component = FaIcons[name as keyof typeof FaIcons];

    if (typeof component !== "function") {
      return null;
    }

    const label = formatIconLabel(name);

    return {
      value,
      name,
      label,
      component: component as IconType,
      keywords: createKeywords(value, name, label),
    };
  })
  .filter((entry): entry is IconRegistryEntry => entry !== null)
  .sort((left, right) => left.label.localeCompare(right.label));

const ICON_REGISTRY_MAP = new Map<string, IconRegistryEntry>();

for (const entry of ICON_REGISTRY) {
  ICON_REGISTRY_MAP.set(entry.value, entry);
  ICON_REGISTRY_MAP.set(entry.name, entry);
}

export function resolveIconName(raw?: string | null) {
  const normalized = String(raw ?? "").trim();

  if (!normalized) {
    return DEFAULT_ICON_NAME;
  }

  if (ICON_REGISTRY_MAP.has(normalized)) {
    return normalized;
  }

  const legacyToken =
    normalized.split(/\s+/).find((token) => token.startsWith("fa-")) ??
    normalized;

  if (ICON_REGISTRY_MAP.has(legacyToken)) {
    return legacyToken;
  }

  return DEFAULT_ICON_NAME;
}

export function getIconMeta(name?: string | null): IconRegistryEntry {
  return ICON_REGISTRY_MAP.get(resolveIconName(name)) ?? ICON_REGISTRY[0];
}

export function useIconSearch(query: string) {
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();

    if (!normalized) {
      return ICON_REGISTRY;
    }

    return ICON_REGISTRY.filter((entry) => {
      const haystack = [
        entry.label.toLowerCase(),
        entry.name.toLowerCase(),
        entry.value.toLowerCase(),
        ...entry.keywords,
      ];

      return haystack.some((value) => value.includes(normalized));
    }).sort((left, right) => {
      const leftStarts = left.label.toLowerCase().startsWith(normalized);
      const rightStarts = right.label.toLowerCase().startsWith(normalized);

      if (leftStarts !== rightStarts) {
        return leftStarts ? -1 : 1;
      }

      return left.label.localeCompare(right.label);
    });
  }, [deferredQuery]);

  return {
    results,
  };
}
