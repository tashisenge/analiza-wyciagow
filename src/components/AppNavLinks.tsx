"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
    href: "/recurring",
    label: "Regularne",
    tip: "Wykryte powtarzalne płatności i subskrypcje — akceptacja sugestii.",
  },
  {
    href: "/opcjonalne",
    label: "Opcjonalne",
    tip: "Wydatki, na które możecie się zgodzić, że da się je ograniczyć.",
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

function navLinkClass(pathname: string, href: string, mobile = false): string {
  const base = isNavActive(pathname, href) ? "nav-link-active" : "nav-link";
  return mobile ? `${base} block min-h-11 w-full px-3 py-3` : base;
}

export function AppNavLinks(): React.JSX.Element {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 py-3">
        <Link href="/dashboard" className="mr-1 shrink-0 text-sm font-bold text-brand-800">
          Analiza wyciągów
        </Link>

        <nav
          className="hidden flex-1 flex-wrap items-center gap-1 md:flex"
          aria-label="Główne menu"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              title={link.tip}
              className={navLinkClass(pathname, link.href)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <InfoTip label="Ukrywanie kwot">
            Przed pokazaniem ekranu komuś włącz „Ukryj kwoty” — maskuje i bluruje wszystkie kwoty w
            tej przeglądarce.
          </InfoTip>
          <PrivacyAmountsToggle compact />
        </div>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <PrivacyAmountsToggle compact />
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-calm-200 text-lg text-slate-700 hover:bg-calm-100"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Zamknij menu" : "Otwórz menu"}
            onClick={() => {
              setMenuOpen((open) => !open);
            }}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav
          id="mobile-nav"
          className="border-t border-calm-200 pb-3 md:hidden"
          aria-label="Główne menu mobilne"
        >
          <ul className="flex flex-col gap-1 pt-2">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  title={link.tip}
                  className={navLinkClass(pathname, link.href, true)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
