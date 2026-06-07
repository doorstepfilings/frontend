import type { ReactNode } from "react";

type AuthSplitLayoutProps = {
  children: ReactNode;
  accentLayout?: "default" | "mirrored";
};

export function AuthSplitLayout({
  children,
  accentLayout = "default",
}: AuthSplitLayoutProps) {
  const primaryAccentPosition =
    accentLayout === "mirrored" ? "absolute right-20 top-20" : "absolute left-20 top-20";
  const secondaryAccentPosition =
    accentLayout === "mirrored"
      ? "absolute bottom-20 left-20"
      : "absolute bottom-20 right-20";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className={`${primaryAccentPosition} h-72 w-72 rounded-full bg-amber-500/20 blur-3xl`} />
        <div className={`${secondaryAccentPosition} h-96 w-96 rounded-full bg-blue-500/20 blur-3xl`} />
      </div>

      <div className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white/95 shadow-2xl backdrop-blur-sm md:flex-row">
        {children}
      </div>
    </div>
  );
}
