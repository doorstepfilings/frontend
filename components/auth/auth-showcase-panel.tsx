import type { ReactNode } from "react";
import Link from "next/link";

type AuthShowcasePanelProps = {
  imageAlt: string;
  imageSrc: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

export function AuthShowcasePanel({
  imageAlt,
  imageSrc,
  title,
  description,
  children,
  className = "",
}: AuthShowcasePanelProps) {
  return (
    <div className={`relative hidden overflow-hidden md:flex md:w-1/2 ${className}`.trim()}>
      <div className="absolute inset-0">
        <img src={imageSrc} alt={imageAlt} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-blue-800/85 to-indigo-900/90" />
      </div>

      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />

      <div className="relative z-10 flex h-full min-h-[400px] flex-col justify-between p-12 text-white md:min-h-[600px]">
        <div>
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 transition-colors hover:bg-white/15"
            title="Go to home page"
          >
            <img
              src="/assets/images/logo.png"
              alt="Doorstep Filings"
              className="h-12 w-12 rounded-xl bg-white object-contain p-1"
            />
            <div>
              <h1 className="text-xl font-bold">DOORSTEP FILINGS</h1>
              <p className="text-xs text-blue-200">Financial & Advisory</p>
            </div>
          </Link>

          <h2 className="mb-4 text-4xl font-bold">{title}</h2>
          <p className="text-lg leading-relaxed text-blue-100">{description}</p>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
