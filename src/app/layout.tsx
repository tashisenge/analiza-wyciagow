import type { Metadata } from "next";

import "./globals.css";

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
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
