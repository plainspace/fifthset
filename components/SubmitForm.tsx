"use client";

import { useState, FormEvent } from "react";
import { Send, Music, MapPin, Calendar, Clock, CheckCircle } from "lucide-react";

const INPUT_CLASS =
  "w-full rounded-lg bg-bg border border-border px-4 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors";

export default function SubmitForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Submission failed");
      }

      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl bg-surface border border-border p-8 sm:p-12 text-center space-y-4">
        <CheckCircle className="w-12 h-12 text-accent mx-auto" />
        <h2 className="font-serif text-2xl text-text">Show submitted</h2>
        <p className="text-text-muted text-balance max-w-md mx-auto">
          We review submissions daily. Most shows are added within 24 hours.
          Thanks for helping us keep the listings complete.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm text-accent hover:underline"
        >
          Submit another show
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Honeypot */}
      <input
        type="text"
        name="_honey"
        tabIndex={-1}
        autoComplete="off"
        className="absolute opacity-0 pointer-events-none h-0 w-0"
      />

      {/* Event details */}
      <div className="rounded-xl bg-surface border border-border p-6 sm:p-8 space-y-6">
        <h2 className="font-serif text-xl text-text flex items-center gap-2">
          <Music className="w-5 h-5 text-accent" />
          Event details
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="artist" className="block text-sm text-text-muted mb-1.5">
              Artist / Band name *
            </label>
            <input
              type="text"
              id="artist"
              name="artist"
              required
              placeholder="e.g. Thelonious Monk Tribute"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="genre" className="block text-sm text-text-muted mb-1.5">
              Genre / Style
            </label>
            <input
              type="text"
              id="genre"
              name="genre"
              placeholder="e.g. Bebop, Funk, Brass Band"
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm text-text-muted mb-1.5">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              Date *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              required
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="time" className="block text-sm text-text-muted mb-1.5">
              <Clock className="w-3.5 h-3.5 inline mr-1" />
              Start time *
            </label>
            <input
              type="time"
              id="time"
              name="time"
              required
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm text-text-muted mb-1.5">
            Description (optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Anything else about the show... cover charge, special guests, etc."
            className={`${INPUT_CLASS} resize-none`}
          />
        </div>
      </div>

      {/* Venue details */}
      <div className="rounded-xl bg-surface border border-border p-6 sm:p-8 space-y-6">
        <h2 className="font-serif text-xl text-text flex items-center gap-2">
          <MapPin className="w-5 h-5 text-accent" />
          Venue
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="venue" className="block text-sm text-text-muted mb-1.5">
              Venue name *
            </label>
            <input
              type="text"
              id="venue"
              name="venue"
              required
              placeholder="e.g. Preservation Hall"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="city" className="block text-sm text-text-muted mb-1.5">
              City *
            </label>
            <select
              id="city"
              name="city"
              required
              className={INPUT_CLASS}
            >
              <option value="">Select a city</option>
              <option value="nyc">New York City</option>
              <option value="nola">New Orleans</option>
              <option value="chicago">Chicago</option>
              <option value="la">Los Angeles</option>
              <option value="sf">San Francisco</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="venue_url" className="block text-sm text-text-muted mb-1.5">
            Venue website or calendar URL
          </label>
          <input
            type="url"
            id="venue_url"
            name="venue_url"
            placeholder="https://..."
            className={INPUT_CLASS}
          />
          <p className="text-xs text-text-muted/60 mt-1.5">
            If you share your calendar URL, we can add it as a recurring
            source so your shows appear automatically.
          </p>
        </div>
      </div>

      {/* Submitter info */}
      <div className="rounded-xl bg-surface border border-border p-6 sm:p-8 space-y-6">
        <h2 className="font-serif text-xl text-text">Your info</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="submitter_name" className="block text-sm text-text-muted mb-1.5">
              Name
            </label>
            <input
              type="text"
              id="submitter_name"
              name="submitter_name"
              placeholder="Your name"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm text-text-muted mb-1.5">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="you@example.com"
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div>
          <label htmlFor="role" className="block text-sm text-text-muted mb-1.5">
            I am a...
          </label>
          <select
            id="role"
            name="role"
            className={INPUT_CLASS}
          >
            <option value="">Select</option>
            <option value="venue">Venue owner / manager</option>
            <option value="artist">Artist / Musician</option>
            <option value="promoter">Promoter / Booker</option>
            <option value="fan">Fan / Listener</option>
          </select>
        </div>
      </div>

      {/* Error message */}
      {status === "error" && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {errorMsg || "Something went wrong. Please try again."}
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-center">
        <button
          type="submit"
          disabled={status === "loading"}
          className="flex items-center gap-2 px-8 py-3 bg-accent text-bg font-medium rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === "loading" ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Show
            </>
          )}
        </button>
      </div>

      <p className="text-center text-xs text-text-muted/60">
        We review submissions daily. Most shows are added within 24 hours.
      </p>
    </form>
  );
}
