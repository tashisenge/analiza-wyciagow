interface InfoTipProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

/** Ikona ? z podpowiedzią (hover / focus). */
export function InfoTip({ label, children, className }: InfoTipProps): React.JSX.Element {
  const wrapClass = className ? `tip-wrap ${className}` : "tip-wrap";
  return (
    <span className={wrapClass}>
      <button type="button" className="tip-trigger" aria-label={label}>
        ?
      </button>
      <span role="tooltip" className="tip-bubble">
        {children}
      </span>
    </span>
  );
}
