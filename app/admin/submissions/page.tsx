"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Status = "pending" | "approved" | "rejected";

interface Submission {
  id: string;
  artist: string;
  venue: string;
  date: string;
  time: string;
  city: string;
  genre: string | null;
  venue_url: string | null;
  submitter_email: string | null;
  created_at: string;
  status: Status;
}

interface EditState {
  artist: string;
  venue: string;
  date: string;
  time: string;
  city: string;
  genre: string;
}

const INPUT_CLASS =
  "w-full rounded-lg bg-bg border border-border px-3 py-2 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors";

const TABS: { label: string; value: Status }[] = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

interface VenueSuggestion {
  id: string;
  name: string;
  city_id: string;
}

function VenueAutocomplete({
  value,
  city,
  onChange,
  disabled,
}: {
  value: string;
  city: string;
  onChange: (val: string) => void;
  disabled: boolean;
}) {
  const [suggestions, setSuggestions] = useState<VenueSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  function handleChange(val: string) {
    onChange(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (val.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: val.trim() });
        if (city && city !== "other") params.set("city", city);
        const res = await fetch(`/api/venues/search?${params}`);
        if (!res.ok) return;
        const json = await res.json();
        const items: VenueSuggestion[] = json.venues ?? [];
        setSuggestions(items);
        setIsOpen(items.length > 0);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, 300);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="relative">
      <input
        className={INPUT_CLASS}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true);
        }}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        onKeyDown={(e) => {
          if (!isOpen) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
          } else if (e.key === "Enter" && activeIndex >= 0) {
            e.preventDefault();
            onChange(suggestions[activeIndex].name);
            setIsOpen(false);
          } else if (e.key === "Escape") {
            setIsOpen(false);
          }
        }}
        disabled={disabled}
      />
      {isOpen && (
        <ul className="absolute z-10 mt-1 w-full rounded-xl bg-surface border border-border shadow-lg overflow-hidden">
          {suggestions.map((venue, i) => (
            <li
              key={venue.id}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                i === activeIndex
                  ? "bg-accent/10 text-accent"
                  : "text-text hover:bg-accent/5"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(venue.name);
                setIsOpen(false);
              }}
            >
              {venue.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const STATUS_BADGE: Record<Status, string> = {
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  approved: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function AdminSubmissionsPage() {
  return (
    <Suspense>
      <AdminSubmissionsInner />
    </Suspense>
  );
}

function AdminSubmissionsInner() {
  const searchParams = useSearchParams();
  const urlKey = searchParams.get("key");

  const [adminKey, setAdminKey] = useState(urlKey || "");
  const [authed, setAuthed] = useState(!!urlKey);
  const [keyInput, setKeyInput] = useState("");

  const [activeTab, setActiveTab] = useState<Status>("pending");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, EditState>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const fetchSubmissions = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/submissions?status=${activeTab}`, {
        headers: { Authorization: `Bearer ${adminKey}` },
      });
      if (!res.ok) {
        if (res.status === 401) {
          setAuthed(false);
          setAdminKey("");
          setError("Invalid admin key.");
          return;
        }
        throw new Error("Failed to fetch");
      }
      const json = await res.json();
      setSubmissions(json.submissions || []);
      setEdits({});
    } catch {
      setError("Failed to load submissions.");
    } finally {
      setLoading(false);
    }
  }, [adminKey, activeTab]);

  useEffect(() => {
    if (authed && adminKey) {
      fetchSubmissions();
    }
  }, [authed, adminKey, activeTab, fetchSubmissions]);

  function handleLogin() {
    if (keyInput.trim()) {
      setAdminKey(keyInput.trim());
      setAuthed(true);
    }
  }

  function getEdit(sub: Submission): EditState {
    return (
      edits[sub.id] || {
        artist: sub.artist,
        venue: sub.venue,
        date: sub.date,
        time: sub.time,
        city: sub.city,
        genre: sub.genre || "",
      }
    );
  }

  function updateField(id: string, sub: Submission, field: keyof EditState, value: string) {
    const current = getEdit(sub);
    setEdits((prev) => ({ ...prev, [id]: { ...current, [field]: value } }));
  }

  async function handleAction(sub: Submission, action: "approved" | "rejected") {
    setActionLoading((prev) => ({ ...prev, [sub.id]: true }));
    try {
      const edit = getEdit(sub);
      const body: Record<string, string> = { status: action };
      if (action === "approved") {
        body.artist = edit.artist;
        body.venue = edit.venue;
        body.date = edit.date;
        body.time = edit.time;
        body.city = edit.city;
        body.genre = edit.genre;
      }
      const res = await fetch(`/api/admin/submissions/${sub.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "Action failed.");
        return;
      }
      setSubmissions((prev) => prev.filter((s) => s.id !== sub.id));
    } catch {
      setError("Action failed.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [sub.id]: false }));
    }
  }

  if (!authed) {
    return (
      <main className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="font-serif text-2xl text-text mb-6 text-center">Submissions</h1>
          <div className="rounded-xl bg-surface border border-border p-6">
            <label className="block text-sm text-text-muted mb-2">Admin Key</label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className={INPUT_CLASS}
              placeholder="Enter admin key"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
            <button
              onClick={handleLogin}
              className="w-full mt-4 rounded-lg bg-accent text-bg font-medium py-2.5 text-sm hover:bg-accent-hover transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg px-4 sm:px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-serif text-2xl sm:text-3xl text-text mb-8">Submissions</h1>

        <div className="flex gap-2 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? "bg-accent text-bg"
                  : "bg-surface text-text-muted hover:bg-surface-hover hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-text-muted text-sm">Loading...</p>
        ) : submissions.length === 0 ? (
          <p className="text-text-muted text-sm">No {activeTab} submissions.</p>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => {
              const edit = getEdit(sub);
              const isLoading = actionLoading[sub.id];
              return (
                <div
                  key={sub.id}
                  className="rounded-xl bg-surface border border-border p-5 sm:p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_BADGE[sub.status]}`}
                    >
                      {sub.status}
                    </span>
                    {sub.submitter_email && (
                      <span className="text-xs text-text-muted">{sub.submitter_email}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Artist</label>
                      <input
                        className={INPUT_CLASS}
                        value={edit.artist}
                        onChange={(e) => updateField(sub.id, sub, "artist", e.target.value)}
                        disabled={sub.status !== "pending"}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Venue</label>
                      <VenueAutocomplete
                        value={edit.venue}
                        city={edit.city}
                        onChange={(val) => updateField(sub.id, sub, "venue", val)}
                        disabled={sub.status !== "pending"}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Date</label>
                      <input
                        type="date"
                        className={INPUT_CLASS}
                        value={edit.date}
                        onChange={(e) => updateField(sub.id, sub, "date", e.target.value)}
                        disabled={sub.status !== "pending"}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Time</label>
                      <input
                        className={INPUT_CLASS}
                        value={edit.time}
                        onChange={(e) => updateField(sub.id, sub, "time", e.target.value)}
                        disabled={sub.status !== "pending"}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">City</label>
                      <input
                        className={INPUT_CLASS}
                        value={edit.city}
                        onChange={(e) => updateField(sub.id, sub, "city", e.target.value)}
                        disabled={sub.status !== "pending"}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-text-muted mb-1">Genre</label>
                      <input
                        className={INPUT_CLASS}
                        value={edit.genre}
                        onChange={(e) => updateField(sub.id, sub, "genre", e.target.value)}
                        disabled={sub.status !== "pending"}
                      />
                    </div>
                  </div>

                  {sub.venue_url && (
                    <div className="mb-4">
                      <label className="block text-xs text-text-muted mb-1">Calendar URL</label>
                      <a
                        href={sub.venue_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-accent hover:underline break-all"
                      >
                        {sub.venue_url}
                      </a>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-text-subtle">
                    <span>
                      Submitted{" "}
                      {new Date(sub.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>

                    {sub.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(sub, "approved")}
                          disabled={isLoading}
                          className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-500 transition-colors disabled:opacity-50"
                        >
                          {isLoading ? "..." : "Approve"}
                        </button>
                        <button
                          onClick={() => handleAction(sub, "rejected")}
                          disabled={isLoading}
                          className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 transition-colors disabled:opacity-50"
                        >
                          {isLoading ? "..." : "Reject"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
