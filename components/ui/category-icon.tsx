"use client";

import type { ComponentProps } from "react";
import { DynamicIcon } from "lucide-react/dynamic";
import {
  getLegacyFontAwesomeClasses,
  getLucideCategoryIconName,
} from "@/lib/icons/category-icons";

type CategoryIconProps = Omit<ComponentProps<"i">, "children"> & {
  icon?: string | null;
  fallback?: string;
  strokeWidth?: number;
};

export function CategoryIcon({
  icon,
  fallback = "fa-briefcase",
  className,
  strokeWidth = 2.1,
  ...rest
}: CategoryIconProps) {
  const lucideName = getLucideCategoryIconName(icon);

  if (lucideName) {
    // Extract className to avoid type conflicts with SVGSVGElement properties
    return (
      <DynamicIcon
        name={lucideName as any}
        className={className}
        strokeWidth={strokeWidth}
      />
    );
  }

  const resolvedClassName = [getLegacyFontAwesomeClasses(icon, fallback), className]
    .filter(Boolean)
    .join(" ");

  return <i className={resolvedClassName} {...rest} />;
}
