import { useEffect, useMemo, useRef, useState } from 'react';
import { Product, Service } from '@/types';

export type SearchResult = (Product | (Service & { type?: 'service' }))[];

export function useSearch(mode: 'sale' | 'service', services: Service[], branchId?: string) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Pre-filter service search by name/code once when query changes
  const filterServices = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || mode !== 'service') return [] as (Service & { type?: 'service' })[];
    return services
      .filter(
        (s) => s.name.toLowerCase().includes(q) || (s.code && s.code.toLowerCase().includes(q))
      )
      .map((s) => ({ ...s, type: 'service' as const }));
  }, [mode, query, services]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    if (query.length < 2) return;

    // For sale mode, require branch selection
    if (mode === 'sale' && !branchId) {
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
        ...(mode === 'service' && { include_services: 'true' }),
        ...(branchId && { branch_id: branchId }),
      });
      
      const url = `/products/search?${params.toString()}`;

      fetch(url, { signal: controller.signal })
        .then((r) => r.json())
        .then((data) => {
          if (!controller.signal.aborted) {
            const merged = mode === 'service' ? [...data, ...filterServices] : data;
            setResults(merged);
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
  }, [mode, query, filterServices, branchId]);

  return {
    query,
    setQuery,
    results,
    loading,
  };
}

