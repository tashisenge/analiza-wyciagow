import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Script from "next/script";

import "./globals.css";

const fontSans = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Analiza wyciągów",
  description: "Zrozum swoje wydatki — firma i dom",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="pl" className={fontSans.variable} suppressHydrationWarning>
      <head>
        <Script
          id="privacy-amounts-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k="analiza-hide-amounts";if(localStorage.getItem(k)==="1")document.documentElement.dataset.hideAmounts="1";}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
