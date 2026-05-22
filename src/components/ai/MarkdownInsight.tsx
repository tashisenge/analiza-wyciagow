function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function renderBlocks(markdown: string): React.ReactNode[] {
  const lines = markdown.split("\n");
  const nodes: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (): void => {
    if (listItems.length === 0) {
      return;
    }
    nodes.push(
      <ul
        key={`list-${String(nodes.length)}`}
        className="my-2 list-inside list-disc space-y-1"
      >
        {listItems.map((item, index) => (
          <li key={index} className="text-slate-700">
            {renderInline(item)}
          </li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      nodes.push(
        <h3
          key={`h-${String(nodes.length)}`}
          className="mt-4 text-base font-semibold text-brand-900 first:mt-0"
        >
          {trimmed.slice(3)}
        </h3>,
      );
      continue;
    }
    if (trimmed.startsWith("- ")) {
      listItems.push(trimmed.slice(2));
      continue;
    }
    flushList();
    nodes.push(
      <p
        key={`p-${String(nodes.length)}`}
        className="my-2 leading-relaxed text-slate-700"
      >
        {renderInline(trimmed)}
      </p>,
    );
  }
  flushList();
  return nodes;
}

export function MarkdownInsight({ content }: { content: string }): React.JSX.Element {
  return <article className="prose-ai text-sm">{renderBlocks(content)}</article>;
}
