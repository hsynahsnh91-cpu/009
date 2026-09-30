"use client";
import { lazy, Suspense, useState, useRef, useEffect } from "react";
import {
  Bookmark,
  RefreshCw,
  Download,
  ArrowUpRight,
  HelpCircle,
  ChevronDown,
  Check,
  Lightbulb,
  GitBranch,
} from "lucide-react";
import { type Explanation, type ExplainRequest } from "@/lib/schema";
import { dictionary, depths, categoryLabel, type T } from "@/lib/i18n";
import { requestExplanation } from "@/lib/storage";
import { download } from "@/lib/export";
const KnowledgeMap = lazy(() => import("./KnowledgeMap"));
function Quiz({ quiz, t }: { quiz: Explanation["quiz"]; t: T }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  return (
    <section className="quiz">
      <span className="eyebrow">03 / {t.quiz}</span>
      {quiz.map((q, i) => (
        <fieldset key={i}>
          <legend>{q.question}</legend>
          <div className="quiz-options">
            {q.options.map((o, j) => (
              <button
                key={o}
                disabled={answers[i] !== undefined}
                className={answers[i] === j ? "selected" : ""}
                onClick={() => setAnswers((a) => ({ ...a, [i]: j }))}
              >
                <span>{String.fromCharCode(65 + j)}</span>
                {o}
                {answers[i] !== undefined && q.answer === j && (
                  <Check size={18} />
                )}
              </button>
            ))}
          </div>
          {answers[i] !== undefined && (
            <p role="status" className="feedback">
              <strong>
                {answers[i] === q.answer ? t.correct : t.incorrect}
              </strong>{" "}
              {q.explanation}
            </p>
          )}
        </fieldset>
      ))}
    </section>
  );
}
function DeepDive({
  e,
  content,
  t,
}: {
  e: Explanation;
  content: string;
  t: T;
}) {
  const [path, setPath] = useState<Explanation[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  async function load() {
    const controller = new AbortController();
    abort.current = controller;
    setBusy(true);
    setError("");
    try {
      const next = await requestExplanation(
        {
          query: e.source === "calculated" ? e.topic : `Why? ${e.topic}`,
          depth: e.depth,
          language: e.language,
          category: "auto",
          visualize: false,
          mode: "why",
          context: (
            path
              .at(-1)
              ?.sections.map((s) => s.content)
              .join("\n") || content
          ).slice(0, 6000),
        },
        controller.signal,
      );
      if (!controller.signal.aborted) setPath((p) => [...p, next]);
    } catch {
      if (!controller.signal.aborted) setError(t.error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="deep-dive">
      {path.map((p, i) => (
        <div className="why-node" key={p.id}>
          <span className="eyebrow">
            {t.whyPath} · {i + 1}
          </span>
          <p>{p.sections[0].content}</p>
        </div>
      ))}
      {e.source === "calculated" && path.length > 0 && <p>{t.localWhyEnd}</p>}
      {error && <p role="alert">{error}</p>}
      <button
        className="text-button"
        disabled={busy || (e.source === "calculated" && path.length > 0)}
        onClick={load}
      >
        <GitBranch size={15} />
        {busy ? t.loading : t.why}
      </button>
      {busy && (
        <button
          onClick={() => {
            abort.current?.abort();
            setBusy(false);
          }}
        >
          {t.cancel}
        </button>
      )}
    </div>
  );
}
export function Reader({
  e,
  favorite,
  onFavorite,
  onAsk,
  busy,
}: {
  e: Explanation;
  favorite: boolean;
  onFavorite: () => void;
  onAsk: (
    q: string,
    depth?: number,
    mode?: ExplainRequest["mode"],
    force?: boolean,
  ) => void;
  busy: boolean;
}) {
  const t = dictionary[e.language];
  const [tab, setTab] = useState(0),
    [exportOpen, setExport] = useState(false),
    [why, setWhy] = useState<string | null>(null);
  const visible = e.sections.filter(
    (s) =>
      tab === 1 || ["idea", "steps", "example", "analogy"].includes(s.kind),
  );
  return (
    <article
      className="reader"
      lang={e.language}
      dir={e.language === "ar" ? "rtl" : "ltr"}
    >
      <div className="reader-top">
        <span className="badge">{categoryLabel(e.category, e.language)}</span>
        <span className="muted">
          {e.source === "calculated" ? t.local : t.ai}
        </span>
      </div>
      <h1>{e.topic}</h1>
      <div className="reader-actions">
        <label>
          {t.depth}
          <select
            value={e.depth}
            disabled={busy}
            onChange={(ev) => onAsk(e.topic, Number(ev.target.value))}
          >
            {depths.map((d, i) => (
              <option value={i + 1} key={d}>
                {i + 1} · {t[d]}
              </option>
            ))}
          </select>
        </label>
        <button onClick={onFavorite} aria-pressed={favorite}>
          <Bookmark size={16} fill={favorite ? "currentColor" : "none"} />
          {favorite ? t.saved : t.save}
        </button>
        <button
          disabled={busy}
          onClick={() => onAsk(e.topic, e.depth, "explain", true)}
        >
          <RefreshCw size={16} />
          {t.regenerate}
        </button>
        <div className="export-wrap">
          <button
            aria-expanded={exportOpen}
            onClick={() => setExport(!exportOpen)}
          >
            <Download size={16} />
            {t.export}
            <ChevronDown size={13} />
          </button>
          {exportOpen && (
            <div className="export-menu">
              {(["md", "txt", "pdf"] as const).map((format) => (
                <button
                  key={format}
                  onClick={() => {
                    setExport(false);
                    if (format === "pdf") window.print();
                    else download(e, format);
                  }}
                >
                  {format === "md"
                    ? t.markdown
                    : format === "txt"
                      ? t.plain
                      : t.pdf}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <nav className="reader-tabs" aria-label={t.depth}>
        {[t.understand, t.deeper, t.explore].map((label, i) => (
          <button
            key={label}
            className={tab === i ? "active" : ""}
            aria-current={tab === i ? "page" : undefined}
            onClick={() => setTab(i)}
          >
            {String(i + 1).padStart(2, "0")} <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="short-answer">
        <span className="eyebrow">
          <Lightbulb size={16} />
          {t.short}
        </span>
        <p>{e.shortAnswer}</p>
      </div>
      {tab === 0 && e.visualize && e.concepts.length > 0 && (
        <Suspense fallback={<p>{t.loading}</p>}>
          <KnowledgeMap
            topic={e.topic}
            concepts={e.concepts}
            onExplore={onAsk}
            t={t}
          />
        </Suspense>
      )}
      {tab < 2 ? (
        <>
          <div className="reading-sections">
            {visible.map((s, i) => (
              <section key={i}>
                <div className="section-heading">
                  <h2>{s.title}</h2>
                  <button
                    className="why-button"
                    aria-expanded={why === s.title}
                    onClick={() => setWhy(why === s.title ? null : s.title)}
                  >
                    <HelpCircle size={15} />
                    {t.why}
                  </button>
                </div>
                {s.kind === "code" || s.kind === "equation" ? (
                  <pre dir="ltr">
                    <code>{s.content}</code>
                  </pre>
                ) : (
                  <p className={s.kind === "analogy" ? "analogy" : ""}>
                    {s.content}
                  </p>
                )}
                {why === s.title && (
                  <DeepDive e={e} content={s.content} t={t} />
                )}
              </section>
            ))}
          </div>
          <button
            className="simplify"
            disabled={busy}
            onClick={() => onAsk(e.topic, 1, "simplify")}
          >
            <HelpCircle size={19} />
            {t.simplify}
            <ArrowUpRight size={17} />
          </button>
          {tab === 0 && (
            <button className="primary deeper-button" onClick={() => setTab(1)}>
              {t.deeper}
              <ChevronDown size={16} />
            </button>
          )}
          {e.quiz.length > 0 && <Quiz quiz={e.quiz} t={t} />}
        </>
      ) : (
        <Suspense fallback={<p>{t.loading}</p>}>
          <KnowledgeMap
            topic={e.topic}
            concepts={e.concepts}
            onExplore={onAsk}
            t={t}
          />
        </Suspense>
      )}
      <section className="follow-ups">
        <h2>{t.follow}</h2>
        {e.followUps.map((q) => (
          <button disabled={busy} key={q} onClick={() => onAsk(q)}>
            {q}
            <ArrowUpRight size={16} />
          </button>
        ))}
      </section>
      {e.source === "ai" && <p className="caution">{t.caution}</p>}
      <div className="print-only">
        {e.sections.map((s, i) => (
          <section key={i}>
            <h2>{s.title}</h2>
            <p>{s.content}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
