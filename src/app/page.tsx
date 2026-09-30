"use client";
import { useEffect, useRef, useState } from "react";
import {
  Compass,
  BookOpen,
  ArrowRight,
  Globe2,
  Menu,
  X,
  Search,
  ChevronRight,
  Network,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { HistoryList } from "@/components/HistoryList";
import { Reader } from "@/components/Reader";
import { SidebarContent } from "@/components/SidebarContent";
import { HomeWorkspace } from "@/components/HomeWorkspace";
import {
  categories,
  type Explanation,
  type Saved,
  type Language,
  type ExplainRequest,
} from "@/lib/schema";
import { dictionary, categoryLabel } from "@/lib/i18n";
import {
  cacheKey,
  persistLibrary,
  readLibrary,
  requestExplanation,
} from "@/lib/storage";
export default function Home() {
  const [language, setLanguage] = useState<Language>("en"),
    [view, setView] = useState("home"),
    [query, setQuery] = useState(""),
    [depth, setDepth] = useState(2),
    [category, setCategory] = useState<ExplainRequest["category"]>("auto"),
    [visualize, setVisualize] = useState(true),
    [library, setLibrary] = useState<Saved[]>([]),
    [current, setCurrent] = useState<Explanation | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [limit, setLimit] = useState(20),
    [drawer, setDrawer] = useState(false),
    [settings, setSettings] = useState(false),
    [configured, setConfigured] = useState(false);

  const controller = useRef<AbortController | null>(null),
    input = useRef<HTMLTextAreaElement>(null);
  const [last, setLast] = useState<ExplainRequest | null>(null);
  const t = dictionary[language];
  // Hydrate browser-only storage after SSR; a single intentional hydration update.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLibrary(readLibrary());
    try {
      const l = localStorage.getItem("explainx.language");
      if (l === "ar" || l === "en") setLanguage(l);
    } catch {}
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => setConfigured(d.configured === true))
      .catch(() => {});
    return () => controller.current?.abort();
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    try {
      localStorage.setItem("explainx.language", language);
    } catch {}
  }, [language]);
  function save(items: Saved[]) {
    setLibrary(items);
    if (!persistLibrary(items)) setError("storage");
  }
  function navigate(v: string) {
    controller.current?.abort();
    setBusy(false);
    setView(v);
    setCurrent(null);
    setError("");
    setDrawer(false);
    setLimit(20);
    setSearch("");
    setFilter("all");
  }
  function open(e: Explanation) {
    controller.current?.abort();
    setBusy(false);
    setError("");
    setCurrent(e);
    setView("reader");
    setDepth(e.depth);
    setDrawer(false);
    window.scrollTo(0, 0);
  }
  async function ask(
    q: string,
    d = depth,
    mode: ExplainRequest["mode"] = "explain",
    force = false,
  ) {
    if (!q.trim()) {
      setError("emptyError");
      input.current?.focus();
      return;
    }
    const request: ExplainRequest = {
      query: q.trim(),
      depth: d,
      language,
      category,
      visualize,
      mode,
      ...(current &&
      (mode !== "explain" || /\b(it|this|that|why)\b|لماذا|هذا|ذلك/i.test(q))
        ? {
            context: JSON.stringify({
              topic: current.topic,
              answer: current.shortAnswer,
              sections: mode === "simplify" ? current.sections : undefined,
            }).slice(0, 6000),
          }
        : {}),
    };
    setLast(request);
    await run(request, force);
  }
  async function run(request: ExplainRequest, force = false) {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setError("");
    setQuery(request.query);
    setDepth(request.depth);
    const key = cacheKey(request);
    const cached = library.find(
      (s) =>
        s.key === key &&
        Date.now() - Date.parse(s.explanation.createdAt) < 604800000,
    );
    if (cached && !force) {
      open(cached.explanation);
      return;
    }
    setBusy(true);
    try {
      const explanation = await requestExplanation(request, abort.signal);
      if (abort.signal.aborted) return;
      const old = library.find((s) => s.key === key);
      const items = [
        { explanation, key, favorite: old?.favorite || false },
        ...library.filter((s) => s.key !== key),
      ];
      const retained = items.filter((s) => s.favorite);
      const unsaved = items.filter((s) => !s.favorite).slice(0, 100);
      save(
        [...retained, ...unsaved].sort((a, b) =>
          b.explanation.createdAt.localeCompare(a.explanation.createdAt),
        ),
      );
      setCurrent(explanation);
      setView("reader");
      window.scrollTo(0, 0);
    } catch (err) {
      if (!abort.signal.aborted)
        setError(
          err instanceof Error &&
            ["unavailable", "network", "rate"].includes(err.message)
            ? err.message
            : "error",
        );
    } finally {
      if (controller.current === abort) setBusy(false);
    }
  }
  function favorite(id: string) {
    save(
      library.map((s) =>
        s.explanation.id === id ? { ...s, favorite: !s.favorite } : s,
      ),
    );
  }
  const filtered = library.filter(
    (s) =>
      (view !== "favorites" || s.favorite) &&
      (filter === "all" || s.explanation.category === filter) &&
      s.explanation.topic
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );
  const nav = (
    <SidebarContent
      language={language}
      setLanguage={setLanguage}
      navigate={navigate}
      onNew={() => {
        navigate("home");
        setQuery("");
        setTimeout(() => input.current?.focus(), 0);
      }}
      view={view}
      library={library}
      open={open}
      setSettings={setSettings}
      configured={configured}
    />
  );

  return (
    <div className="app-shell">
      <a className="skip" href="#main">
        {t.next}
      </a>
      <aside className="sidebar">{nav}</aside>
      <Dialog.Root open={drawer} onOpenChange={setDrawer}>
        <Dialog.Portal>
          <Dialog.Overlay className="overlay" />
          <Dialog.Content className="mobile-drawer">
            <Dialog.Title className="sr-only">{t.workspace}</Dialog.Title>
            <Dialog.Description className="sr-only">
              {t.menu}
            </Dialog.Description>
            <Dialog.Close className="drawer-close" aria-label={t.close}>
              <X size={20} />
            </Dialog.Close>
            {nav}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <div className="main-shell">
        <header className="topbar">
          <button
            className="mobile-menu"
            aria-label={t.menu}
            onClick={() => setDrawer(true)}
          >
            <Menu size={20} />
          </button>
          <div className="breadcrumb">
            <Compass size={16} />
            <span>{t.home}</span>
            {view !== "home" && (
              <>
                <ChevronRight size={13} />
                <span>
                  {view === "reader"
                    ? t.understand
                    : view === "history"
                      ? t.history
                      : t.favorites}
                </span>
              </>
            )}
          </div>
          <div className="topbar-right">
            <span className="small-star">✧</span>
            {t.curious}
            <span className="topbar-divider" />
            <button
              aria-label={t.language}
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
            >
              <Globe2 size={16} />
              {language === "en" ? "EN" : "AR"}
            </button>
          </div>
        </header>
        <main id="main">
          {error && (
            <div className="error-banner" role="alert">
              <div>{t[error as keyof typeof t] || t.error}</div>
              {error === "unavailable" ? (
                <button onClick={() => setSettings(true)}>{t.setup}</button>
              ) : (
                last && (
                  <button onClick={() => run(last!, true)}>{t.retry}</button>
                )
              )}
              <button aria-label={t.close} onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {busy && (
            <div className="loading-panel" role="status">
              <div className="loading-symbol">
                <Network size={28} />
              </div>
              <div>
                <h3>{t.loading}</h3>
                <p>{t.loadingSub}</p>
                <div className="loading-track" />
              </div>
              <button
                onClick={() => {
                  controller.current?.abort();
                  setBusy(false);
                }}
              >
                {t.cancel}
              </button>
            </div>
          )}
          {view === "home" ? (
            <HomeWorkspace
              language={language}
              query={query}
              setQuery={setQuery}
              depth={depth}
              setDepth={setDepth}
              category={category}
              setCategory={setCategory}
              visualize={visualize}
              setVisualize={setVisualize}
              busy={busy}
              input={input}
              ask={ask}
              library={library}
              navigate={navigate}
              open={open}
              favorite={favorite}
              save={save}
            />
          ) : view === "reader" && current ? (
            <>
              <button className="back-button" onClick={() => navigate("home")}>
                ← {t.back}
              </button>
              <Reader
                key={current.id}
                e={current}
                favorite={
                  library.find((s) => s.explanation.id === current.id)
                    ?.favorite || false
                }
                onFavorite={() => favorite(current.id)}
                onAsk={ask}
                busy={busy}
              />
              <form
                className="follow-question"
                onSubmit={(e) => {
                  e.preventDefault();
                  ask(query);
                }}
              >
                <input
                  aria-label={t.placeholder}
                  placeholder={t.placeholder}
                  value={query}
                  maxLength={1200}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button className="primary" disabled={busy}>
                  {t.explain}
                  <ArrowRight size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="library-page">
              <span className="eyebrow">{t.workspace}</span>
              <h1>{view === "history" ? t.history : t.favorites}</h1>
              <p>
                {filtered.length} {t.count} · {t.private}
              </p>
              <div className="library-tools">
                <label>
                  <Search size={18} />
                  <input
                    aria-label={t.search}
                    placeholder={t.search}
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setLimit(20);
                    }}
                  />
                </label>
                <select
                  aria-label={t.all}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">{t.all}</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {categoryLabel(c, language)}
                    </option>
                  ))}
                </select>
              </div>
              <HistoryList
                items={filtered.slice(0, limit)}
                language={language}
                onOpen={open}
                onFavorite={favorite}
                onDelete={(id) =>
                  save(library.filter((s) => s.explanation.id !== id))
                }
              />
              {filtered.length === 0 && (
                <div className="empty-state">
                  <BookOpen size={26} />
                  <p>{search ? t.noMatch : t.empty}</p>
                </div>
              )}
              {filtered.length > limit && (
                <button onClick={() => setLimit((l) => l + 20)}>
                  {t.more}
                </button>
              )}
            </div>
          )}
        </main>
      </div>
      <Dialog.Root open={settings} onOpenChange={setSettings}>
        <Dialog.Portal>
          <Dialog.Overlay className="overlay" />
          <Dialog.Content className="settings-dialog">
            <Dialog.Title>
              <Network size={24} />
              {t.setupTitle}
            </Dialog.Title>
            <Dialog.Description>{t.setupText}</Dialog.Description>
            <div className="connection-state">
              <span
                className={configured ? "status-dot ready" : "status-dot"}
              />
              {configured ? t.connected : t.disconnected}
            </div>
            <p>{t.localNote}</p>
            <button
              className="primary"
              onClick={() => {
                setSettings(false);
                navigate("home");
                setQuery("2x + 5 = 15");
              }}
            >
              {t.example4}
              <ArrowRight size={16} />
            </button>
            <Dialog.Close className="dialog-close" aria-label={t.close}>
              <X size={20} />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
