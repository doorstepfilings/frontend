import dynamicIconImports from "lucide-react/dynamicIconImports";

const LUCIDE_ICON_PREFIX = "lucide:";
export const DEFAULT_CATEGORY_ICON = "fa-briefcase";

const lucideIconNameSet = new Set(Object.keys(dynamicIconImports));

export function getLucideCategoryIconName(icon?: string | null) {
  if (typeof icon !== "string" || !icon.startsWith(LUCIDE_ICON_PREFIX)) {
    return null;
  }

  const name = icon.slice(LUCIDE_ICON_PREFIX.length).trim();
  return lucideIconNameSet.has(name) ? name : null;
}

function formatLucideIconName(name: string) {
  return name
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function formatLegacyFontAwesomeName(icon?: string | null) {
  const normalized = String(icon ?? "")
    .trim()
    .replace(/\bfa[srlbd]?\b/g, "")
    .replace(/\bfa-(solid|regular|brands|light|duotone)\b/g, "")
    .trim();

  const token = normalized
    .split(/\s+/)
    .find((part) => part.startsWith("fa-"));

  if (!token) {
    return "Business";
  }

  return token
    .replace(/^fa-/, "")
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function getStoredCategoryIconLabel(icon?: string | null) {
  const lucideName = getLucideCategoryIconName(icon);
  if (lucideName) {
    return formatLucideIconName(lucideName);
  }

  return formatLegacyFontAwesomeName(icon);
}

export function getLegacyFontAwesomeClasses(
  icon?: string | null,
  fallback = "fa-briefcase",
) {
  const resolved = typeof icon === "string" && icon.trim() ? icon.trim() : fallback;
  const hasIconToken = /\bfa-[a-z0-9-]+\b/.test(resolved);
  const hasStylePrefix =
    /\bfa(s|r|l|b|d)\b/.test(resolved) ||
    /\bfa-(solid|regular|brands|light|duotone)\b/.test(resolved);

  if (!hasIconToken) {
    return `fas ${fallback}`;
  }

  return hasStylePrefix ? resolved : `fas ${resolved}`;
}
