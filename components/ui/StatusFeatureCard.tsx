import { ElementType } from "react";
import Link from "next/link";

interface StatusFeatureCardProps {
  title: string;
  description: string;
  Icon: ElementType;
  href?: string;
}

export function StatusFeatureCard({
  title,
  description,
  Icon,
  href,
}: StatusFeatureCardProps) {
  const content = (
    <>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Icon size={28} strokeWidth={2} />
      </div>
      <h3 className="mb-2 text-base font-bold text-slate-900">{title}</h3>
      <p className="text-sm font-medium leading-relaxed text-slate-500">
        {description}
      </p>
    </>
  );

  const className =
    "flex h-full flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-blue-100 hover:shadow-md";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
