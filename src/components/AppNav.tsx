import { AppNavLinks } from "@/components/AppNavLinks";

export function AppNav(): React.JSX.Element {
  return (
    <header className="sticky top-0 z-40 border-b border-calm-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <AppNavLinks />
      </div>
    </header>
  );
}
