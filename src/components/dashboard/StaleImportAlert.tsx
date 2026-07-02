import Link from "next/link";

interface StaleImportAlertProps {
  daysSinceImport: number;
}

export function StaleImportAlert({
  daysSinceImport,
}: StaleImportAlertProps): React.JSX.Element {
  return (
    <p className="alert-warning text-sm" role="status">
      Ostatni import wyciągu był {String(daysSinceImport)} dni temu — limity i alerty mogą
      być nieaktualne.{" "}
      <Link href="/import" className="link-brand font-medium">
        Zaimportuj świeży CSV
      </Link>
    </p>
  );
}
