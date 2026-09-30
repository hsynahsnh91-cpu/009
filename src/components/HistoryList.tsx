import { BookOpen, Bookmark, Trash2 } from "lucide-react";
import { dictionary, depths, categoryLabel } from "@/lib/i18n";
import type { Saved, Language, Explanation } from "@/lib/schema";
export function HistoryList({
  items,
  language,
  onOpen,
  onFavorite,
  onDelete,
}: {
  items: Saved[];
  language: Language;
  onOpen: (e: Explanation) => void;
  onFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const t = dictionary[language];
  return items.map((s) => (
    <div className="history-row" key={s.explanation.id}>
      <button className="row-open" onClick={() => onOpen(s.explanation)}>
        <span className="row-icon">
          <BookOpen size={19} />
        </span>
        <span>
          <strong>{s.explanation.topic}</strong>
          <small>
            {categoryLabel(s.explanation.category, language)} ·{" "}
            {t[depths[s.explanation.depth - 1]]} ·{" "}
            {new Date(s.explanation.createdAt).toLocaleDateString(language)}
          </small>
        </span>
      </button>
      <button
        className="icon-button"
        aria-label={t.save}
        aria-pressed={s.favorite}
        onClick={() => onFavorite(s.explanation.id)}
      >
        <Bookmark size={17} fill={s.favorite ? "currentColor" : "none"} />
      </button>
      <button
        className="icon-button"
        aria-label={`${t.delete}: ${s.explanation.topic}`}
        onClick={() => onDelete(s.explanation.id)}
      >
        <Trash2 size={16} />
      </button>
    </div>
  ));
}
