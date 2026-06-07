import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DoorstepFilings",
  description: "Professional filing services at your doorstep",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        {/* Inline splash styles — zero JS needed, paints on first byte */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              #__initial_splash__{
                position:fixed;inset:0;z-index:9999;
                display:flex;align-items:center;justify-content:center;
                background:#f8fafc;
                transition:opacity 0.35s ease;
              }
              #__initial_splash__ .sp-card{
                display:flex;flex-direction:column;align-items:center;gap:20px;
                background:#fff;border-radius:28px;padding:40px 44px;
                box-shadow:0 30px 80px -30px rgba(15,23,42,0.22),0 0 0 1px rgba(148,163,184,0.2);
              }
              #__initial_splash__ .sp-ring-wrap{
                position:relative;width:124px;height:124px;
                display:flex;align-items:center;justify-content:center;
              }
              #__initial_splash__ .sp-glow{
                position:absolute;inset:-4px;border-radius:50%;
                background:rgba(37,99,235,0.12);filter:blur(14px);
                animation:sp-pulse 2.4s ease-in-out infinite;
              }
              #__initial_splash__ .sp-ring{
                position:absolute;inset:0;border-radius:50%;
                border:2px solid transparent;
                border-top-color:#2563eb;border-right-color:#bfdbfe;
                animation:sp-spin 1.25s linear infinite;
              }
              #__initial_splash__ .sp-inner{
                position:absolute;inset:10px;border-radius:50%;
                background:#fff;border:1px solid #e2e8f0;
                box-shadow:0 10px 30px -10px rgba(37,99,235,0.25);
                display:flex;align-items:center;justify-content:center;
                animation:sp-bob 1.8s ease-in-out infinite;
              }
              #__initial_splash__ .sp-inner img{
                width:56px;height:56px;object-fit:contain;border-radius:50%;
              }
              #__initial_splash__ .sp-dots{
                display:flex;gap:8px;
              }
              #__initial_splash__ .sp-dot{
                width:7px;height:7px;border-radius:50%;background:#2563eb;
                animation:sp-bounce 1.2s ease-in-out infinite;
              }
              #__initial_splash__ .sp-dot:nth-child(2){animation-delay:0.2s;}
              #__initial_splash__ .sp-dot:nth-child(3){animation-delay:0.4s;}
              #__initial_splash__ .sp-label{
                font-size:13px;font-weight:500;color:#64748b;letter-spacing:0.01em;
                font-family:ui-sans-serif,system-ui,sans-serif;margin-top:-4px;
              }
              @keyframes sp-spin{to{transform:rotate(360deg);}}
              @keyframes sp-pulse{0%,100%{opacity:0.45;transform:scale(1);}50%{opacity:0.75;transform:scale(1.12);}}
              @keyframes sp-bob{0%,100%{transform:scale(1);}50%{transform:scale(1.035);}}
              @keyframes sp-bounce{0%,80%,100%{transform:translateY(0);opacity:0.6;}40%{transform:translateY(-6px);opacity:1;}}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className={inter.className}>
        {/* Pure-HTML initial splash — shows instantly before JS, removed by Providers after hydration */}
        <div id="__initial_splash__">
          <div className="sp-card">
            <div className="sp-ring-wrap">
              <div className="sp-glow" />
              <div className="sp-ring" />
              <div className="sp-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/favicon-round.png" alt="DoorstepFilings" />
              </div>
            </div>
            <div className="sp-dots">
              <div className="sp-dot" />
              <div className="sp-dot" />
              <div className="sp-dot" />
            </div>
            <p className="sp-label">Preparing your workspace…</p>
          </div>
        </div>

        <Providers>{children}</Providers>
        <GoogleAnalytics gaId="G-0ZXCCTJT5N" />
      </body>
    </html>
  );
}
