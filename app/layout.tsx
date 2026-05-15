"use client";

import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store/StoreProvider";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

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
            </head>
            <body suppressHydrationWarning className={inter.className}>
                <StoreProvider>
                    <Toaster position="top-right" />
                    {children}
                </StoreProvider>
            </body>
            <GoogleAnalytics gaId="G-0ZXCCTJT5N" />
        </html>
    );
}
