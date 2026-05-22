import Link from "next/link";

interface FilterChipProps {
  href: string;
  active: boolean;
  children: React.ReactNode;
  title?: string;
}

export function FilterChip({
  href,
  active,
  children,
  title,
}: FilterChipProps): React.JSX.Element {
  return (
    <Link href={href} title={title} className={active ? "chip-active" : "chip"}>
      {children}
    </Link>
  );
}
