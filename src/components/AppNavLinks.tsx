"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { PrivacyAmountsToggle } from "@/components/privacy/PrivacyAmountsToggle";
import { InfoTip } from "@/components/ui/InfoTip";

const LINKS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    tip: "Podsumowanie wydatków, wykresy i szybki wgląd AI.",
  },
  {
    href: "/optimize",
    label: "Optymalizacja",
    tip: "Sugestie oszczędności, budżety i research alternatyw.",
  },
  {
    href: "/transactions",
    label: "Transakcje",
    tip: "Lista operacji, kategoryzacja i podobne transakcje.",
  },
  {
    href: "/review",
    label: "Weryfikacja",
    tip: "Kolejka rozbieżności kategorii mBank vs aplikacja.",
  },
  {
    href: "/import",
    label: "Import",
    tip: "Wgranie CSV z mBanku na wybrane konto.",
  },
  {
    href: "/categories",
    label: "Kategorie",
    tip: "Własne kategorie i reguły automatyczne.",
  },
  {
    href: "/settings",
    label: "Ustawienia",
    tip: "Konta, zaproszenia partnera i tryb prezentacji.",
  },
] as const;

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname.startsWith(href);
}

export function AppNavLinks(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <>
      <nav className="flex flex-1 flex-wrap items-center gap-1" aria-label="Główne menu">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            title={link.tip}
            className={isNavActive(pathname, link.href) ? "nav-link-active" : "nav-link"}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        <InfoTip label="Ukrywanie kwot">
          Przed pokazaniem ekranu komuś włącz „Ukryj kwoty” — maskuje i bluruje wszystkie
          kwoty w tej przeglądarce.
        </InfoTip>
        <PrivacyAmountsToggle compact />
      </div>
    </>
  );
}
