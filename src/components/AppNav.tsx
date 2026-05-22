import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/optimize", label: "Optymalizacja" },
  { href: "/transactions", label: "Transakcje" },
  { href: "/import", label: "Import" },
  { href: "/categories", label: "Kategorie" },
  { href: "/settings", label: "Ustawienia" },
] as const;

export function AppNav(): React.JSX.Element {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-slate-200 bg-white px-4 py-3">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
