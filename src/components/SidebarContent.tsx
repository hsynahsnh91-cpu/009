"use client";
import {
  Network,
  Plus,
  Compass,
  History,
  Bookmark,
  Sparkles,
  Settings2,
  Globe2,
  BookOpen,
} from "lucide-react";
import { dictionary } from "@/lib/i18n";
import type { Language, Saved, Explanation } from "@/lib/schema";
interface Props {
  language: Language;
  setLanguage: (l: Language) => void;
  navigate: (v: string) => void;
  onNew: () => void;
  view: string;
  library: Saved[];
  open: (e: Explanation) => void;
  setSettings: (b: boolean) => void;
  configured: boolean;
}
export function SidebarContent({
  language,
  setLanguage,
  navigate,
  onNew,
  view,
  library,
  open,
  setSettings,
  configured,
}: Props) {
  const t = dictionary[language];
  return (
    <>
      <button
        className="brand"
        onClick={() => navigate("home")}
        aria-label="ExplainX"
      >
        <span className="brand-icon">
          <Network size={23} />
        </span>
        explain<span className="brand-x">x</span>
        <span className="beta">BETA</span>
      </button>
      <button
        className="new-button"
        onClick={() => {
          onNew();
        }}
      >
        <Plus size={17} />
        {t.new}
      </button>
      <div className="nav-caption">{t.workspace}</div>
      <nav>
        {[
          { id: "home", label: t.home, icon: Compass },
          { id: "history", label: t.history, icon: History },
          { id: "favorites", label: t.favorites, icon: Bookmark },
        ].map((n) => (
          <button
            key={n.id}
            className={view === n.id ? "nav-item active" : "nav-item"}
            onClick={() => navigate(n.id)}
          >
            <n.icon size={18} />
            {n.label}
            {n.id === "favorites" && (
              <span className="nav-count">
                {library.filter((s) => s.favorite).length}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="sidebar-recent">
        <div className="nav-caption">{t.recent}</div>
        {library.slice(0, 4).map((s) => (
          <button key={s.explanation.id} onClick={() => open(s.explanation)}>
            <span className="tiny-dot" />
            {s.explanation.topic}
          </button>
        ))}
      </div>
      <div className="sidebar-bottom">
        <div className="quiet-note">
          <Sparkles size={18} />
          <p>{t.footer}</p>
          <span>{t.private}</span>
        </div>
        <button className="nav-item" onClick={() => setSettings(true)}>
          <Settings2 size={17} />
          {t.setup}
          <span className={configured ? "status-dot ready" : "status-dot"} />
        </button>
        <button
          className="nav-item language"
          onClick={() => setLanguage(language === "en" ? "ar" : "en")}
        >
          <Globe2 size={17} />
          {language === "en" ? "English" : "العربية"}
          <span>{language === "en" ? "العربية" : "EN"}</span>
        </button>
        <div className="profile">
          <div className="avatar">
            <BookOpen size={17} />
          </div>
          <div>
            <strong>{t.mind}</strong>
            <span>{t.space}</span>
          </div>
        </div>
      </div>
    </>
  );
}
