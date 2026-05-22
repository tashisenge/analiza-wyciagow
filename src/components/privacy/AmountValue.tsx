interface AmountValueProps {
  children: React.ReactNode;
  className?: string;
}

/** Owijka kwoty — przy `data-hide-amounts` na &lt;html&gt; maskuje i bluruje (CSS). */
export function AmountValue({
  children,
  className,
}: AmountValueProps): React.JSX.Element {
  const wrapperClass = className ? `amount-value ${className}` : "amount-value";
  return (
    <span className={wrapperClass}>
      <span className="amount-value-text">{children}</span>
    </span>
  );
}
