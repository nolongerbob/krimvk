"use client";

import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search as SearchIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SearchProps {
  mobileMode?: boolean;
  inHeader?: boolean;
}

type SearchResult = {
  url: string;
  title: string;
  description?: string;
  type?: string;
};

type PanelPosition = {
  top: number;
  left: number;
  right: number;
};

export function Search({ mobileMode = false, inHeader = false }: SearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelPos, setPanelPos] = useState<PanelPosition>({ top: 0, left: 0, right: 0 });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const closeSearch = useCallback(() => {
    if (!isOpen) return;
    setIsOpen(false);
    setQuery("");
    setResults([]);
  }, [isOpen]);

  const openSearch = () => {
    setIsOpen(true);
  };

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const headerRow =
      trigger.closest("[data-header-inner]") ??
      trigger.closest("header")?.querySelector("[data-header-inner]");
    const rowRect = headerRow?.getBoundingClientRect();
    const header = trigger.closest("header") ?? document.querySelector("header");
    const headerBottom = header?.getBoundingClientRect().bottom ?? triggerRect.bottom;
    const inHeaderBar = Boolean(trigger.closest("[data-header-inner]"));

    setPanelPos({
      top: headerBottom,
      left: inHeaderBar ? triggerRect.left : (rowRect?.left ?? triggerRect.left),
      right: 0,
    });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [isOpen, updatePanelPosition]);

  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      if (isOpen) closeSearch();
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, closeSearch]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) closeSearch();
    };
    if (isOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, closeSearch]);

  useEffect(() => {
    if (query.length >= 2) {
      const timeoutId = window.setTimeout(() => {
        void performSearch(query);
      }, 300);
      return () => window.clearTimeout(timeoutId);
    }
    setResults([]);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
      closeSearch();
    }
  };

  const panel =
    isOpen && mounted ? (
      <div
        ref={panelRef}
        style={{
          top: panelPos.top,
          left: panelPos.left,
          right: panelPos.right,
        }}
        className="fixed z-[70]"
        role="dialog"
        aria-modal="true"
        aria-label="Поиск по сайту"
      >
        <div className="bg-white rounded-none">
          <form
            onSubmit={handleSubmit}
            className="flex h-11 items-stretch border-b border-slate-200"
          >
            <div className="relative flex-1 min-w-0">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Поиск по сайту..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-full min-h-0 rounded-none border-0 px-3 pr-9 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Очистить"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-none text-slate-600 hover:text-slate-900 focus:outline-none focus-visible:outline-none"
              aria-label="Найти"
            >
              <SearchIcon className="h-4 w-4" />
            </button>
          </form>

          {query.length >= 2 && (
            <div className="max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-slate-500">Поиск...</div>
              ) : results.length > 0 ? (
                <div className="py-1">
                  {results.map((result, index) => (
                    <Link
                      key={`${result.url}-${index}`}
                      href={result.url}
                      onClick={closeSearch}
                      className="block border-b border-slate-100 px-4 py-2.5 last:border-b-0 hover:bg-slate-50 transition-colors"
                    >
                      <div className="line-clamp-1 text-sm font-medium text-slate-900">{result.title}</div>
                      {result.description && (
                        <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">{result.description}</div>
                      )}
                    </Link>
                  ))}
                  <div className="border-t border-slate-100 px-4 py-2">
                    <Link
                      href={`/search?q=${encodeURIComponent(query)}`}
                      onClick={closeSearch}
                      className="text-xs text-primary hover:underline"
                    >
                      Все результаты →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-slate-500">Ничего не найдено</div>
              )}
            </div>
          )}
        </div>
      </div>
    ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (isOpen ? closeSearch() : openSearch())}
        className={`inline-flex items-center justify-center rounded-none transition-colors focus:outline-none focus-visible:outline-none active:outline-none ${
          inHeader
            ? `h-full w-full ${isOpen ? "bg-slate-50" : "hover:bg-slate-50"}`
            : `h-9 w-9 ${isOpen ? "bg-transparent" : "hover:bg-slate-100"} ${mobileMode ? "h-10 w-10" : ""}`
        } ${mobileMode && !inHeader ? "" : ""}`}
        aria-label="Поиск"
        aria-expanded={isOpen}
      >
        <SearchIcon
          className={`text-slate-600 ${
            inHeader ? "h-5 w-5 lg:h-6 lg:w-6" : mobileMode ? "h-6 w-6 stroke-[1.75]" : "h-5 w-5"
          }`}
        />
      </button>

      {panel ? createPortal(panel, document.body) : null}
    </>
  );
};
