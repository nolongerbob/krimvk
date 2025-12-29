"use client";

import { useState, useEffect, useRef } from "react";

interface AddressInputProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  required?: boolean;
}

interface DaDataSuggestion {
  value: string;
  unrestricted_value: string;
  data: {
    postal_code?: string;
    city?: string;
    street?: string;
    house?: string;
    flat?: string;
  };
}

export function AddressInput({
  value,
  onChange,
  placeholder = "Начните вводить адрес...",
  className = "",
  id,
  required = false,
}: AddressInputProps) {
  const [suggestions, setSuggestions] = useState<DaDataSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log("Fetching suggestions for:", query);
      const response = await fetch("/api/address/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);
      
      if (response.ok) {
        const suggestionsList = data.suggestions || [];
        console.log("Setting suggestions count:", suggestionsList.length);
        setSuggestions(suggestionsList);
        setShowSuggestions(suggestionsList.length > 0);
        console.log("showSuggestions set to:", suggestionsList.length > 0);
      } else {
        console.error("API error:", data);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    fetchSuggestions(newValue);
  };

  const handleSelectSuggestion = (suggestion: DaDataSuggestion) => {
    onChange(suggestion.value);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
        autoComplete="off"
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
          style={{ top: '100%' }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-sm">{suggestion.value}</div>
              {suggestion.data.postal_code && (
                <div className="text-xs text-gray-500">
                  Индекс: {suggestion.data.postal_code}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

