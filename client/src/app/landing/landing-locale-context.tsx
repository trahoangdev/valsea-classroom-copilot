"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { LandingLocale } from "./landing-translations";
import { pickT } from "./landing-translations";

const STORAGE_KEY = "landing-locale";

type LandingLocaleContextValue = {
  locale: LandingLocale;
  setLocale: (locale: LandingLocale) => void;
  t: ReturnType<typeof pickT>;
};

const LandingLocaleContext = createContext<LandingLocaleContextValue | null>(null);

export function LandingLocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LandingLocale>("vi");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LandingLocale | null;
    if (saved === "vi" || saved === "en") {
      setLocaleState(saved);
    }
    setHydrated(true);
  }, []);

  const setLocale = useCallback((next: LandingLocale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next === "vi" ? "vi" : "en";
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.lang = locale === "vi" ? "vi" : "en";
  }, [locale, hydrated]);

  const t = useMemo(() => pickT(locale), [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return (
    <LandingLocaleContext.Provider value={value}>{children}</LandingLocaleContext.Provider>
  );
}

export function useLandingLocale() {
  const ctx = useContext(LandingLocaleContext);
  if (!ctx) {
    throw new Error("useLandingLocale must be used within LandingLocaleProvider");
  }
  return ctx;
}

export function LandingLanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLandingLocale();

  return (
    <ToggleGroup
      type="single"
      value={locale}
      onValueChange={(v) => {
        if (v === "vi" || v === "en") setLocale(v);
      }}
      className={`border border-border rounded-md p-0.5 h-9 ${className ?? ""}`}
      aria-label="Language: Vietnamese or English"
    >
      <ToggleGroupItem
        value="vi"
        className="h-8 px-2.5 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground cursor-pointer"
      >
        VI
      </ToggleGroupItem>
      <ToggleGroupItem
        value="en"
        className="h-8 px-2.5 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground cursor-pointer"
      >
        EN
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
