"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage, type Locale } from "@/lib/i18n";

export function VikobaLogo({
  light = false,
  compact = false,
}: {
  light?: boolean;
  compact?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-black tracking-tight ${light ? "text-white" : "text-foreground"} ${compact ? "text-base" : "text-xl"}`}
    >
      <span className="grid place-items-center rounded-lg bg-primary text-primary-foreground font-black h-8 w-8">
        V
      </span>
      <span>
        VIKOBA<span className="text-primary">360</span>
      </span>
    </span>
  );
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("v360_theme");
    const enabled = saved === "dark";
    setDark(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("v360_theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:text-primary transition"
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();
  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      aria-label={t("common.language")}
      className="h-9 rounded-lg border border-border bg-card px-2 text-xs font-semibold text-foreground outline-none"
    >
      <option value="sw">SW</option>
      <option value="en">EN</option>
    </select>
  );
}
