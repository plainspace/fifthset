"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2 } from "lucide-react";
import { signIn, signUp, signInWithGoogle, signInWithSpotify } from "@/lib/supabase/auth";
import { cn } from "@/lib/utils";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const action = mode === "login" ? signIn : signUp;
    const { error } = await action(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      setError(null);
      setMode("login");
      setLoading(false);
      setEmail("");
      setPassword("");
      return;
    }

    router.push("/nyc");
  }

  async function handleGoogle() {
    setError(null);
    setOauthLoading("google");
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
      setOauthLoading(null);
    }
  }

  async function handleSpotify() {
    setError(null);
    setOauthLoading("spotify");
    const { error } = await signInWithSpotify();
    if (error) {
      setError(error.message);
      setOauthLoading(null);
    }
  }

  const inputClass =
    "w-full bg-surface border border-border rounded-lg px-4 py-3 text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent transition-colors";

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-6">
            <h1 className="font-serif text-4xl text-accent">Fifth Set</h1>
          </Link>
          <p className="text-text-muted">
            {mode === "login"
              ? "Sign in to save your favorites"
              : "Create an account to get started"}
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-8">
          <div className="flex gap-2 mb-8">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={cn(
                "flex-1 py-2.5 rounded-lg font-mono text-xs uppercase tracking-widest transition-colors",
                mode === "login"
                  ? "bg-accent text-bg"
                  : "bg-surface-hover text-text-muted hover:text-text"
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className={cn(
                "flex-1 py-2.5 rounded-lg font-mono text-xs uppercase tracking-widest transition-colors",
                mode === "signup"
                  ? "bg-accent text-bg"
                  : "bg-surface-hover text-text-muted hover:text-text"
              )}
            >
              Sign Up
            </button>
          </div>

          <div className="flex flex-col gap-3 mb-6">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={!!oauthLoading || loading}
              className="flex items-center justify-center gap-3 w-full py-3 bg-surface-hover border border-border rounded-lg text-text hover:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {oauthLoading === "google" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span className="text-sm">Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={handleSpotify}
              disabled={!!oauthLoading || loading}
              className="flex items-center justify-center gap-3 w-full py-3 bg-surface-hover border border-border rounded-lg text-text hover:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {oauthLoading === "spotify" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
              )}
              <span className="text-sm">Continue with Spotify</span>
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-border" />
            <span className="font-mono text-xs text-text-muted uppercase tracking-widest">
              or
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={cn(inputClass, "pl-11")}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className={cn(inputClass, "pl-11")}
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm px-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !!oauthLoading}
              className="flex items-center justify-center gap-2 w-full py-3 bg-accent text-bg rounded-lg font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-text-muted text-sm mt-8">
          <Link href="/" className="hover:text-accent transition-colors">
            Back to Fifth Set
          </Link>
        </p>
      </div>
    </div>
  );
}
