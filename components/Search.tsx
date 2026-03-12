"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search as SearchIcon, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";


export default function Search() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ venues: { name: string; slug: string; neighborhood: string }[]; artists: { name: string; slug: string }[] }>({ venues: [], artists: [] });
  const inputRef = useRef<HTMLInputElement>(null);
  const params = useParams();
  const router = useRouter();
  const citySlug = (params.city as string) || "nyc";
  const supabase = createClient();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (query.length < 2) {
      setResults({ venues: [], artists: [] });
      return;
    }
    const timeout = setTimeout(async () => {
      const [venueRes, artistRes] = await Promise.all([
        supabase
          .from("venues")
          .select("name, slug, neighborhood, cities!inner(slug)")
          .eq("cities.slug", citySlug)
          .ilike("name", `%${query}%`)
          .limit(5),
        supabase
          .from("artists")
          .select("name, slug")
          .ilike("name", `%${query}%`)
          .limit(5),
      ]);
      setResults({
        venues: (venueRes.data || []).map((v: Record<string, unknown>) => ({ name: v.name as string, slug: v.slug as string, neighborhood: (v.neighborhood as string) || "" })),
        artists: (artistRes.data || []).map((a: Record<string, unknown>) => ({ name: a.name as string, slug: a.slug as string })),
      });
    }, 200);
    return () => clearTimeout(timeout);
  }, [query, citySlug, supabase]);

  const navigate = (path: string) => {
    router.push(path);
    setOpen(false);
    setQuery("");
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-muted hover:text-text bg-surface rounded-lg transition-colors"
      >
        <SearchIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline text-xs text-text-muted/60 ml-1">⌘K</kbd>
      </button>
    );
  }

  const hasResults = results.venues.length > 0 || results.artists.length > 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setOpen(false)} />
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50 px-4">
        <div className="bg-surface border border-border rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <SearchIcon className="w-5 h-5 text-text-muted shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search venues and artists..."
              className="flex-1 bg-transparent text-text placeholder:text-text-muted/60 outline-none"
            />
            <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text">
              <X className="w-4 h-4" />
            </button>
          </div>

          {hasResults && (
            <div className="max-h-80 overflow-y-auto p-2">
              {results.venues.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs uppercase tracking-wider text-text-muted px-2 py-1">Venues</p>
                  {results.venues.map((v) => (
                    <button
                      key={v.slug}
                      onClick={() => navigate(`/${citySlug}/venues/${v.slug}`)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors"
                    >
                      <span className="text-sm text-text">{v.name}</span>
                      {v.neighborhood && (
                        <span className="text-xs text-text-muted ml-2">{v.neighborhood}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {results.artists.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-text-muted px-2 py-1">Artists</p>
                  {results.artists.map((a) => (
                    <button
                      key={a.slug}
                      onClick={() => navigate(`/${citySlug}/artists/${a.slug}`)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors"
                    >
                      <span className="text-sm text-text">{a.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {query.length >= 2 && !hasResults && (
            <div className="p-6 text-center text-text-muted text-sm">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {query.length < 2 && (
            <div className="p-6 text-center text-text-muted/60 text-sm">
              Type to search venues and artists
            </div>
          )}
        </div>
      </div>
    </>
  );
}
