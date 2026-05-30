import { ElementType } from "react";

interface StatusFeatureCardProps {
  title: string;
  description: string;
  Icon: ElementType;
}

export function StatusFeatureCard({ title, description, Icon }: StatusFeatureCardProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        <Icon size={28} strokeWidth={2} />
      </div>
      <h3 className="mb-2 text-base font-bold text-slate-900">{title}</h3>
      <p className="text-sm font-medium text-slate-500 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
