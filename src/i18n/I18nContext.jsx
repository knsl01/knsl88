import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import id from "./locales/id.js";
import en from "./locales/en.js";

const STORAGE_KEY = "knsl:locale";
const LOCALES = { id, en };
const DEFAULT_LOCALE = "id";

const I18nContext = createContext(null);

function interpolate(str, vars = {}) {
  if (!str || typeof str !== "string") return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => (vars[key] != null ? String(vars[key]) : ""));
}

function resolve(dict, key) {
  const val = key.split(".").reduce((o, k) => (o && o[k] != null ? o[k] : undefined), dict);
  return val;
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s === "en" || s === "id") return s;
    } catch { /* ignore */ }
    return DEFAULT_LOCALE;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch { /* ignore */ }
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale === "en" ? "en" : "id";
    }
  }, [locale]);

  const setLocale = useCallback((next) => {
    if (next === "id" || next === "en") setLocaleState(next);
  }, []);

  const t = useCallback(
    (key, vars) => {
      const raw = resolve(LOCALES[locale], key) ?? resolve(LOCALES[DEFAULT_LOCALE], key) ?? key;
      return typeof raw === "string" ? interpolate(raw, vars) : key;
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, isId: locale === "id", isEn: locale === "en" }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function formatLocaleDate(locale) {
  try {
    return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  } catch {
    return "";
  }
}
