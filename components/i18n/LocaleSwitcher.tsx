"use client";

import { Check, ChevronDown, Languages, Search } from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { AppStrings } from "@/lib/i18n/app-strings";
import {
  getSupportedLocale,
  supportedLocales,
  type LocaleCode,
} from "@/lib/i18n/locales";

type LocaleSwitcherProps = {
  locale: LocaleCode;
  className?: string;
  /** Build the destination path for a locale. Defaults to `/{locale}`. */
  getHref?: (locale: LocaleCode) => string;
};

export function LocaleSwitcher({
  locale,
  className,
  getHref = defaultLocaleHref,
}: LocaleSwitcherProps) {
  const messages = AppStrings.forLocale(locale);
  const current = getSupportedLocale(locale);
  const listboxId = useId();
  const searchId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredLocales = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matches = supportedLocales.filter((item) => {
      if (!normalized) {
        return true;
      }

      return (
        item.nativeName.toLowerCase().includes(normalized) ||
        item.englishName.toLowerCase().includes(normalized) ||
        item.code.toLowerCase().includes(normalized)
      );
    });

    return matches.sort((a, b) => {
      if (a.code === locale) {
        return -1;
      }
      if (b.code === locale) {
        return 1;
      }
      return a.englishName.localeCompare(b.englishName);
    });
  }, [locale, query]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      searchRef.current?.focus();
    });

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
    setQuery("");
  }

  function toggleOpen() {
    if (open) {
      closeMenu();
      return;
    }

    setOpen(true);
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (
      event.key === "ArrowDown" ||
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      setOpen(true);
    }
  }

  return (
    <div className={`relative ${className ?? ""}`} ref={rootRef}>
      <button
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={messages.app.language}
        className="inline-flex h-10 max-w-44 items-center gap-1.5 rounded-sm border border-(--line-strong) bg-(--paper) px-2.5 text-sm font-medium text-(--ink) transition hover:border-(--ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) sm:max-w-none sm:gap-2 sm:px-3"
        onClick={toggleOpen}
        onKeyDown={handleTriggerKeyDown}
        type="button"
      >
        <Languages
          aria-hidden="true"
          className="size-3.5 shrink-0 text-(--accent)"
        />
        <span className="truncate">{current.nativeName}</span>
        <ChevronDown
          aria-hidden="true"
          className={`size-3.5 shrink-0 text-(--ink-muted) transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div
        aria-hidden={!open}
        className={`absolute inset-e-0 top-[calc(100%+0.4rem)] z-30 w-[min(18.5rem,calc(100vw-2rem))] origin-top-right transition duration-150 ease-out ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-[0.98] opacity-0"
        }`}
        inert={open ? undefined : true}
      >
        <div className="overflow-hidden rounded-sm border border-(--line) bg-white shadow-[0_18px_40px_rgba(48,37,26,0.16)]">
          <div className="border-b border-(--line) p-2">
            <label className="sr-only" htmlFor={searchId}>
              {messages.app.searchLanguage}
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute inset-s-2.5 top-1/2 size-3.5 -translate-y-1/2 text-(--ink-muted)"
              />
              <input
                autoComplete="off"
                className="h-10 w-full rounded-sm border border-(--line-strong) bg-(--paper) pe-3 ps-8 text-sm text-(--ink) outline-none transition placeholder:text-(--ink-faint) focus:border-(--accent) focus:ring-2 focus:ring-(--accent-soft)"
                id={searchId}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={messages.app.searchLanguage}
                ref={searchRef}
                type="search"
                value={query}
              />
            </div>
          </div>

          <ul
            className="max-h-64 overflow-y-auto py-1"
            id={listboxId}
            role="listbox"
            aria-label={messages.app.language}
          >
            {filteredLocales.length === 0 ? (
              <li className="px-3 py-3 text-sm text-(--ink-muted)">
                {messages.app.noMatchingLanguages}
              </li>
            ) : (
              filteredLocales.map((item) => {
                const selected = item.code === locale;

                return (
                  <li key={item.code} role="option" aria-selected={selected}>
                    <Link
                      className={`flex items-center gap-3 px-3 py-2.5 text-left transition hover:bg-background ${
                        selected ? "bg-(--accent-soft)/35" : ""
                      }`}
                      href={getHref(item.code)}
                      hrefLang={item.code}
                      onClick={closeMenu}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-(--ink)">
                          {item.nativeName}
                        </span>
                        <span className="block truncate text-xs text-(--ink-muted)">
                          {item.englishName}
                        </span>
                      </span>
                      {selected ? (
                        <Check
                          aria-hidden="true"
                          className="size-4 shrink-0 text-(--accent)"
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="w-4 shrink-0 font-mono text-[0.65rem] uppercase text-(--ink-faint)"
                        >
                          {item.code}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function defaultLocaleHref(locale: LocaleCode) {
  return `/${locale}`;
}
