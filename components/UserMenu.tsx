"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/supabase/auth";
import type { User } from "@supabase/supabase-js";

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
    router.refresh();
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-sm text-text-muted hover:text-text transition-colors"
      >
        Sign In
      </Link>
    );
  }

  const email = user.email || "";
  const initial = email.charAt(0).toUpperCase();
  const truncatedEmail =
    email.length > 24 ? email.slice(0, 24) + "..." : email;

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Account menu"
        aria-expanded={menuOpen}
        aria-haspopup="true"
        className="w-8 h-8 rounded-full bg-accent text-bg flex items-center justify-center text-sm font-medium"
      >
        {initial}
      </button>
      {menuOpen && (
        <>
          <div className="fixed inset-0" onClick={() => setMenuOpen(false)} />
          <div role="menu" className="absolute top-full mt-2 right-0 bg-surface border border-border rounded-lg shadow-xl py-1 min-w-[200px]">
            <div className="px-4 py-2 border-b border-border">
              <p className="text-sm text-text-muted truncate">{truncatedEmail}</p>
            </div>
            <Link
              href="/settings"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2 text-sm text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
            >
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4" aria-hidden="true" />
                Preferences
              </span>
            </Link>
            <button
              role="menuitem"
              onClick={handleSignOut}
              className="w-full text-left block px-4 py-2 text-sm text-text-muted hover:text-text hover:bg-surface-hover transition-colors"
            >
              <span className="flex items-center gap-2">
                <LogOut className="w-4 h-4" aria-hidden="true" />
                Sign Out
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
