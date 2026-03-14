"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/supabase/auth";
import type { User } from "@supabase/supabase-js";

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Account menu"
          className="w-8 h-8 rounded-full bg-accent text-bg flex items-center justify-center text-sm font-medium outline-none"
        >
          {initial}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px] bg-surface border-border">
        <DropdownMenuLabel className="text-text-muted truncate">
          {truncatedEmail}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2 text-text-muted">
            <Settings className="w-4 h-4" aria-hidden="true" />
            Preferences
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 text-text-muted">
          <LogOut className="w-4 h-4" aria-hidden="true" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
