"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Loader2 } from "lucide-react";
import { signInWithOtp, verifyOtp } from "@/lib/supabase/auth";
import { cn } from "@/lib/utils";

type Step = "email" | "code";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("from") || "/nyc";
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signInWithOtp(email);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep("code");
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await verifyOtp(email, code);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(returnTo);
  }

  const inputClass =
    "w-full bg-surface border border-border rounded-lg px-4 py-3 text-text placeholder:text-text-muted/50 focus:outline-2 focus:outline-accent focus:outline-offset-[-1px] transition-colors";

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-6">
            <h1 className="font-serif text-4xl text-accent">Fifth Set</h1>
          </Link>
          <p className="text-text-muted">
            {step === "email"
              ? "Enter your email to sign in or create an account"
              : "Check your email for a code"}
          </p>
          {step === "email" && (
            <div className="flex flex-col gap-1.5 mt-3">
              <p className="text-sm text-text-muted">Save shows to your list</p>
              <p className="text-sm text-text-muted">Set your home city</p>
              <p className="text-sm text-text-muted">Never miss a set</p>
            </div>
          )}
        </div>

        <div className="bg-surface rounded-2xl border border-border p-8">
          {step === "email" ? (
            <form onSubmit={handleSendCode} className="flex flex-col gap-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50" aria-hidden="true" />
                <input
                  type="email"
                  placeholder="Email"
                  aria-label="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className={cn(inputClass, "pl-11")}
                />
              </div>

              {error && (
                <p role="alert" className="text-destructive text-sm px-1">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-3 bg-accent text-bg rounded-lg font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Code
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
              <p className="text-sm text-text-muted text-center mb-2">
                We sent a code to{" "}
                <span className="text-text font-medium">{email}</span>
              </p>

              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter code"
                aria-label="Verification code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                required
                autoFocus
                autoComplete="one-time-code"
                className={cn(inputClass, "text-center text-2xl tracking-[0.3em] font-mono")}
              />

              {error && (
                <p role="alert" className="text-destructive text-sm px-1">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="flex items-center justify-center gap-2 w-full py-3 bg-accent text-bg rounded-lg font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Verify
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError(null);
                }}
                className="text-sm text-text-muted hover:text-text transition-colors"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-text-muted text-sm mt-8">
          <Link href="/" className="hover:text-accent transition-colors">
            Back to Fifth Set
          </Link>
        </p>
      </div>
    </main>
  );
}
