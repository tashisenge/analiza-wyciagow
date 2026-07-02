export function ReviewQueueBanner({
  banner,
  error,
}: {
  banner: { type: "success" | "error"; text: string } | null;
  error: string | null;
}): React.JSX.Element | null {
  if (banner) {
    return (
      <p
        className={
          banner.type === "success" ? "alert-success text-sm" : "alert-error text-sm"
        }
        role="status"
      >
        {banner.text}
      </p>
    );
  }
  if (error) {
    return <p className="alert-error text-sm">{error}</p>;
  }
  return null;
}
