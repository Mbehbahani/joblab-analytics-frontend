"use client";

import { useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";

const STORAGE_KEY = "kanban_user_id";

/**
 * Reads `kanbanUser` from URL query params (set by JobPilot "Browse Jobs" link)
 * and persists it in sessionStorage for the duration of the browser session.
 * Returns the userId (or null if not set).
 */
export function useKanbanUser(): string | null {
  const searchParams = useSearchParams();

  useEffect(() => {
    const fromUrl = searchParams.get("kanbanUser");
    if (fromUrl) {
      sessionStorage.setItem(STORAGE_KEY, fromUrl);
    }
  }, [searchParams]);

  // Read from sessionStorage (URL param takes precedence if present)
  const getKanbanUserId = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    const fromUrl = searchParams.get("kanbanUser");
    if (fromUrl) return fromUrl;
    return sessionStorage.getItem(STORAGE_KEY);
  }, [searchParams]);

  return getKanbanUserId();
}
