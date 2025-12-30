"use client";

import { useState, useEffect, useRef } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SearchProps {
  mobileMode?: boolean;
}

export function Search({ mobileMode = false }: SearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
        setResults([]);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      inputRef.current?.focus();
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (query.length >= 2) {
      const timeoutId = setTimeout(() => {
        performSearch(query);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setResults([]);
    }
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
      setIsOpen(false);
      setQuery("");
    }
  };

  return (
    <div ref={searchRef} className="relative">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus-visible:outline-none active:outline-none"
          aria-label="Поиск"
        >
          <SearchIcon className="h-5 w-5 text-gray-600" />
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Поиск по сайту..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`pl-10 pr-10 ${mobileMode ? 'w-full' : 'w-48 md:w-64'}`}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="submit" size="sm" className="hidden md:inline-flex">
            Найти
          </Button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setQuery("");
              setResults([]);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Закрыть поиск"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </form>
      )}

      {isOpen && query.length >= 2 && (
        <div className={`${mobileMode ? 'relative' : 'absolute top-full left-0 right-0'} mt-2 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto`}>
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Поиск...</div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <Link
                  key={index}
                  href={result.url}
                  onClick={() => {
                    setIsOpen(false);
                    setQuery("");
                  }}
                  className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-sm text-gray-900">{result.title}</div>
                  {result.description && (
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">{result.description}</div>
                  )}
                  <div className="text-xs text-blue-600 mt-1">{result.type}</div>
                </Link>
              ))}
              <div className="border-t px-4 py-2">
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  onClick={() => setIsOpen(false)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Показать все результаты →
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              Ничего не найдено
            </div>
          )}
        </div>
      )}
    </div>
  );
}

