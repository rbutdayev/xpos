import { useEffect, useRef, useState } from 'react';
import { Product } from '@/types';

export type SearchResult = Product[];

export function useSearch(branchId?: string) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    if (query.length < 2) return;

    // Require branch selection
    if (!branchId) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // debounce
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      // abort previous
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const params = new URLSearchParams({
        q: query,
        ...(branchId && { branch_id: branchId }),
      });

      const url = `/products/search?${params.toString()}`;

      fetch(url, { signal: controller.signal })
        .then((r) => r.json())
        .then((data) => {
          if (!controller.signal.aborted) {
            setResults(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (err?.name !== 'AbortError') {
            console.error('Search error:', err);
            setResults([]);
            setLoading(false);
          }
        });
    }, 300);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [query, branchId]);

  return {
    query,
    setQuery,
    results,
    loading,
  };
}

