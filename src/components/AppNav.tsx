import { AppNavLinks } from "@/components/AppNavLinks";

export function AppNav(): React.JSX.Element {
  return (
    <header className="sticky top-0 z-40 border-b border-calm-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
        <a href="/dashboard" className="mr-2 text-sm font-bold text-brand-800">
          Analiza wyciągów
        </a>
        <AppNavLinks />
      </div>
    </header>
  );
}
