"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/supabase/auth";
import { cities } from "@/lib/cities";
import { cn } from "@/lib/utils";

type TimeFilter = "afternoon" | "evening" | "late-night" | null;

const timeFilterOptions: { value: TimeFilter; label: string }[] = [
  { value: null, label: "No default" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "late-night", label: "Late Night" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [selectedCitySlug, setSelectedCitySlug] = useState<string>("");
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<TimeFilter>(null);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? null);

      const { data } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setSelectedCitySlug(data.home_city_slug ?? "");
        setSelectedTimeFilter(data.default_time_filter ?? null);
      }

      setLoading(false);
    }

    init();
  }, [router]);

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    const supabase = createClient();
    const { error: saveError } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: userId,
          home_city_slug: selectedCitySlug || null,
          default_time_filter: selectedTimeFilter || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (saveError) {
      setError(saveError.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }

    setSaving(false);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
      </div>
    );
  }

  const selectClass =
    "w-full bg-bg border border-border rounded-lg px-4 py-3 text-text focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="bg-surface border border-border rounded-2xl p-8">
          <h1 className="font-serif text-2xl text-text mb-1">Preferences</h1>
          <p className="text-text-muted text-sm mb-8">{email}</p>

          <div className="flex flex-col gap-8">
            <div>
              <label className="block font-mono text-xs text-text-muted uppercase tracking-widest mb-3">
                Home City
              </label>
              <div className="relative">
                <select
                  value={selectedCitySlug}
                  onChange={(e) => setSelectedCitySlug(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select a city</option>
                  {cities.map((city) => (
                    <option key={city.slug} value={city.slug}>
                      {city.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M3 4.5L6 7.5L9 4.5" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs text-text-muted uppercase tracking-widest mb-3">
                Default Time Filter
              </label>
              <div className="flex flex-wrap gap-2">
                {timeFilterOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setSelectedTimeFilter(option.value)}
                    className={cn(
                      "px-4 py-2.5 rounded-lg font-mono text-xs uppercase tracking-widest transition-colors",
                      selectedTimeFilter === option.value
                        ? "bg-accent text-bg"
                        : "bg-bg border border-border text-text-muted hover:text-text hover:border-accent/50"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 w-full py-3 bg-accent text-bg rounded-lg font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saved ? "Saved" : "Save Preferences"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 px-1">
          <Link
            href="/"
            className="text-text-muted text-sm hover:text-accent transition-colors"
          >
            Back to Fifth Set
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-text-muted text-sm hover:text-red-400 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
