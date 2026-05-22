import { InfoTip } from "@/components/ui/InfoTip";

interface PageHeaderProps {
  title: string;
  lead?: string;
  tip?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  lead,
  tip,
  actions,
}: PageHeaderProps): React.JSX.Element {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="page-title">
          {title}
          {tip ? <InfoTip label="Podpowiedź">{tip}</InfoTip> : null}
        </h1>
        {lead ? <p className="page-lead">{lead}</p> : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
