'use client';

/**
 * SearchBar Component
 * 
 * Live search with debouncing, dropdown results, and keyboard navigation.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, Loader2, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { searchUsers } from '@/app/actions/search';
import { getAvatarUrl } from '@/lib/profile.types';
import type { SearchResult } from '@/lib/search.types';
import { Input } from '@/components/ui/input';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEBOUNCE_DELAY = 300;

// ============================================================================
// COMPONENT
// ============================================================================

export default function SearchBar() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Debounced query
  const debouncedQuery = useDebounce(query.trim(), DEBOUNCE_DELAY);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Search when debounced query changes
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      try {
        const response = await searchUsers(debouncedQuery);
        if (response.success) {
          setResults(response.results);
          setIsOpen(true);
          setHighlightedIndex(-1);
        }
      } catch (error) {
        console.error('[SearchBar] Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const navigateToProfile = useCallback(
    (result: SearchResult) => {
      setQuery('');
      setIsOpen(false);
      setResults([]);
      setHighlightedIndex(-1);
      router.push(`/profile/${result.username}`);
    },
    [router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || results.length === 0) {
        if (e.key === 'Escape') {
          setIsOpen(false);
          inputRef.current?.blur();
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;

        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && results[highlightedIndex]) {
            navigateToProfile(results[highlightedIndex]);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setHighlightedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, results, highlightedIndex, navigateToProfile]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (!e.target.value.trim()) {
      setIsOpen(false);
      setResults([]);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleResultClick = (result: SearchResult) => {
    navigateToProfile(result);
  };

  const handleResultMouseEnter = (index: number) => {
    setHighlightedIndex(index);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder="Search users..."
          autoComplete="off"
          className="pl-9 pr-8 h-9 bg-gray-100 border-0 focus-visible:ring-1"
          aria-label="Search users"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
          aria-activedescendant={
            highlightedIndex >= 0 ? `search-result-${highlightedIndex}` : undefined
          }
        />
        {/* Clear button or loading spinner */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
          role="listbox"
        >
          {isLoading && results.length === 0 ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No users found
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {results.map((result, index) => (
                <li
                  key={result.id}
                  id={`search-result-${index}`}
                  role="option"
                  aria-selected={highlightedIndex === index}
                >
                  <button
                    type="button"
                    onClick={() => handleResultClick(result)}
                    onMouseEnter={() => handleResultMouseEnter(index)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                      ${highlightedIndex === index ? 'bg-gray-100' : 'hover:bg-gray-50'}
                    `}
                  >
                    <Image
                      src={getAvatarUrl(result.profilePictureUrl, result.username)}
                      alt={result.username}
                      width={36}
                      height={36}
                      className="rounded-full object-cover"
                    />
                    <span className="font-medium text-sm truncate">
                      {result.username}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

