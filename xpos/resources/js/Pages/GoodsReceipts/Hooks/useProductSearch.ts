import { useEffect, useRef, useState } from 'react';

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  unit: string;
  base_unit?: string;
  packaging_size?: string;
  packaging_quantity?: number;
  unit_price?: number;
}

export function useProductSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }
    if (query.length < 2) {
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // debounce
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      // abort previous
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const url = `/products/search?q=${encodeURIComponent(query)}`;

      fetch(url, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
        .then((r) => {
          if (!r.ok) {
            throw new Error(`Server error ${r.status}`);
          }
          return r.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setResults(data);
            setError(null);
          } else {
            setResults([]);
            setError('Invalid response format');
          }
        })
        .catch((err) => {
          if (err?.name !== 'AbortError') {
            console.error('Product search error:', err);
            setResults([]);
            setError('Search failed. Please try again.');
          }
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [query]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
  };
}