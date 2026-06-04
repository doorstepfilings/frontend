"use client";

import { getIconMeta } from "@/hooks/use-icon-search";

type ReactIconProps = {
  iconName: string;
  size?: number;
  className?: string;
};

export function ReactIcon({
  iconName,
  size = 18,
  className,
}: ReactIconProps) {
  const meta = getIconMeta(iconName);
  const Icon = meta.component;

  return <Icon size={size} className={className} />;
}
