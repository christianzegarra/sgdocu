import { memo } from "react";

interface HighlightedTextProps {
  text: string;
  query: string | string[];
}

/**
 * Renderiza texto resaltando las coincidencias con la consulta de búsqueda.
 */
const HighlightedText = memo(({ text, query }: HighlightedTextProps) => {
  const qStr = Array.isArray(query)
    ? query
        .filter(Boolean)
        .map((q) => q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|")
    : query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (!qStr) return <>{text}</>;

  const parts = text.split(new RegExp(`(${qStr})`, "gi"));
  return (
    <>
      {parts.map((p, i) => {
        const isMatch = Array.isArray(query) ? query.some((q) => q.toLowerCase() === p.toLowerCase()) : query.toLowerCase() === p.toLowerCase();

        return isMatch ? (
          <mark key={i} className='bg-primary/20 text-primary font-medium rounded-sm px-0.5'>
            {p}
          </mark>
        ) : (
          p
        );
      })}
    </>
  );
});

HighlightedText.displayName = "HighlightedText";

export { HighlightedText };
