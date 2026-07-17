"use client";

import { useEffect, useRef, useState } from "react";
import type { PlaceSearchResult } from "@/services/location-service";

type PlaceSearchState = {
  results: PlaceSearchResult | null;
  isSearching: boolean;
  error: boolean;
};

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

/**
 * Debounced client hook that queries `/api/places` for birthplace suggestions.
 *
 * The hook aborts in-flight requests when the query changes so late responses
 * cannot overwrite newer results, and it clears results for queries shorter
 * than the minimum length.
 */
export function usePlaceSearch(query: string): PlaceSearchState {
  const [state, setState] = useState<PlaceSearchState>({
    results: null,
    isSearching: false,
    error: false,
  });
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    controllerRef.current?.abort();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      const resetTimer = setTimeout(() => {
        setState({ results: null, isSearching: false, error: false });
      }, 0);

      return () => clearTimeout(resetTimer);
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    const pendingTimer = setTimeout(() => {
      setState({ results: null, isSearching: true, error: false });
    }, 0);

    const timer = setTimeout(() => {
      fetch(`/api/places?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error("Place search failed");
          }

          const body = (await response.json()) as PlaceSearchResult;
          setState({ results: body, isSearching: false, error: false });
        })
        .catch((cause: unknown) => {
          if (cause instanceof DOMException && cause.name === "AbortError") {
            return;
          }

          setState({ results: null, isSearching: false, error: true });
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(pendingTimer);
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return state;
}
