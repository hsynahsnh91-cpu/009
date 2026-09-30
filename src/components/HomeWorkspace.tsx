"use client";
import { useState, type RefObject } from "react";
import {
  Sparkles,
  X,
  Globe2,
  Network,
  ArrowRight,
  ArrowUpRight,
  Orbit,
  Atom,
  Code2,
  Brain,
  History,
  BookOpen,
} from "lucide-react";
import { Orbital } from "./Orbital";
import { HistoryList } from "./HistoryList";
import { dictionary, depths, categoryLabel } from "@/lib/i18n";
import {
  categories,
  type ExplainRequest,
  type Saved,
  type Explanation,
  type Language,
} from "@/lib/schema";
const topicCards = [
  {
    category: "Physics",
    icon: Atom,
    query: "How does gravity work?",
    ar: "كيف تعمل الجاذبية؟",
    desc: "The rules of our universe",
    arDesc: "قوانين كوننا",
    color: "lavender",
  },
  {
    category: "Technology",
    icon: Code2,
    query: "How does an AI model learn?",
    ar: "كيف يتعلم نموذج الذكاء الاصطناعي؟",
    desc: "Ideas shaping tomorrow",
    arDesc: "أفكار تصنع المستقبل",
    color: "blue",
  },
  {
    category: "Psychology",
    icon: Brain,
    query: "Why do we dream?",
    ar: "لماذا نحلم؟",
    desc: "Inside the human mind",
    arDesc: "داخل العقل البشري",
    color: "peach",
  },
  {
    category: "Astronomy",
    icon: Orbit,
    query: "How does a black hole work?",
    ar: "كيف يعمل الثقب الأسود؟",
    desc: "Beyond our little planet",
    arDesc: "ما وراء كوكبنا",
    color: "green",
  },
];

interface Props {
  language: Language;
  query: string;
  setQuery: (q: string) => void;
  depth: number;
  setDepth: (d: number) => void;
  category: ExplainRequest["category"];
  setCategory: (c: ExplainRequest["category"]) => void;
  visualize: boolean;
  setVisualize: (v: boolean) => void;
  busy: boolean;
  input: RefObject<HTMLTextAreaElement | null>;
  ask: (q: string) => void;
  library: Saved[];
  navigate: (v: string) => void;
  open: (e: Explanation) => void;
  favorite: (id: string) => void;
  save: (items: Saved[]) => void;
}
export function HomeWorkspace({
  language,
  query,
  setQuery,
  depth,
  setDepth,
  category,
  setCategory,
  visualize,
  setVisualize,
  busy,
  input,
  ask,
  library,
  navigate,
  open,
  favorite,
  save,
}: Props) {
  const t = dictionary[language];
  const [allTopics, setAllTopics] = useState(false);
  return (
    <div className="home-content">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="little-line" />
            {t.eyebrow}
          </div>
          <h1>
            {t.title}
            <br />
            <span>{t.subtitle}</span>
          </h1>
          <p>{t.intro}</p>
        </div>
        <Orbital />
      </section>
      <form
        className="question-box"
        onSubmit={(e) => {
          e.preventDefault();
          ask(query);
        }}
      >
        <div className="question-input">
          <Sparkles size={21} />
          <textarea
            ref={input}
            aria-label={t.placeholder}
            placeholder={t.placeholder}
            value={query}
            maxLength={1200}
            rows={2}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(query);
              }
            }}
          />
          {query && (
            <button
              type="button"
              aria-label={t.clear}
              onClick={() => setQuery("")}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="question-tools">
          <label className="category-select">
            <Globe2 size={14} />
            <select
              aria-label={t.all}
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as ExplainRequest["category"])
              }
            >
              <option value="auto">{t.auto}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c, language)}
                </option>
              ))}
            </select>
          </label>
          <label className="visual-toggle">
            <input
              type="checkbox"
              checked={visualize}
              onChange={(e) => setVisualize(e.target.checked)}
            />
            <Network size={15} />
            {t.visualize}
          </label>
          <button className="primary" disabled={busy} type="submit">
            {t.explain}
            <ArrowRight size={17} />
          </button>
        </div>
      </form>
      <div className="depth-control">
        <div className="depth-label">
          <span>{t.depth}</span>
          <span className="depth-hint">{t.depthHelp}</span>
        </div>
        <div className="depth-options" role="group" aria-label={t.depth}>
          {depths.map((d, i) => (
            <button
              key={d}
              aria-pressed={depth === i + 1}
              onClick={() => setDepth(i + 1)}
              className={depth === i + 1 ? "selected" : ""}
            >
              <span className="depth-bars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <i
                    key={n}
                    style={{
                      height: 4 + n * 2,
                      opacity: n <= i + 1 ? 1 : 0.2,
                    }}
                  />
                ))}
              </span>
              {t[d]}
            </button>
          ))}
        </div>
      </div>
      <div className="inspiration">
        <span>{t.try}</span>
        <div>
          {["example1", "example2", "example3", "example4"].map((key, i) => (
            <button
              key={key}
              onClick={() => {
                setQuery(t[key as keyof typeof t]);
                input.current?.focus();
              }}
            >
              {i === 0 ? (
                <Orbit size={14} />
              ) : i === 3 ? (
                <span>ƒ</span>
              ) : (
                <Sparkles size={13} />
              )}{" "}
              {t[key as keyof typeof t]}
              <ArrowUpRight size={13} />
            </button>
          ))}
        </div>
      </div>
      <section className="topics">
        <div className="section-heading">
          <div>
            <h2>{t.topics}</h2>
            <p>{t.topicsSub}</p>
          </div>
          <button
            className="text-button"
            onClick={() => setAllTopics(!allTopics)}
            aria-expanded={allTopics}
          >
            {t.all}
            <ArrowRight size={15} />
          </button>
        </div>
        <div className="topic-grid">
          {topicCards.map((c) => (
            <button
              className={`topic-card ${c.color}`}
              key={c.category}
              onClick={() => {
                setQuery(language === "en" ? c.query : c.ar);
                input.current?.focus();
              }}
            >
              <div className="topic-card-top">
                <span className="topic-icon">
                  <c.icon size={23} />
                </span>
                <ArrowUpRight size={16} />
              </div>
              <h3>{categoryLabel(c.category, language)}</h3>
              <p>{language === "en" ? c.desc : c.arDesc}</p>
            </button>
          ))}
        </div>
        {allTopics && (
          <div className="topic-chips">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCategory(c);
                  setQuery(categoryLabel(c, language));
                  input.current?.focus();
                }}
              >
                {categoryLabel(c, language)}
              </button>
            ))}
          </div>
        )}
      </section>
      <section className="recent">
        <div className="section-heading">
          <h2>
            <History size={18} />
            {t.recent}
          </h2>
          <button className="text-button" onClick={() => navigate("history")}>
            {t.viewAll}
            <ArrowRight size={15} />
          </button>
        </div>
        {library.length ? (
          <HistoryList
            items={library.slice(0, 3)}
            language={language}
            onOpen={open}
            onFavorite={favorite}
            onDelete={(id) =>
              save(library.filter((s) => s.explanation.id !== id))
            }
          />
        ) : (
          <div className="empty-state">
            <span className="empty-icon">
              <BookOpen size={23} />
            </span>
            <div>
              <h3>{t.empty}</h3>
              <p>{t.emptySub}</p>
            </div>
            <span className="empty-spark">✧</span>
          </div>
        )}
      </section>
      <footer>
        <span>
          <span className="small-star">✧</span> {t.footer}
        </span>
        <span>ExplainX · 2026</span>
      </footer>
    </div>
  );
}
