"use client";

/**
 * Strona logowania.
 *
 * Jak to dziala: formularz wysyla e-mail i haslo do Supabase Auth
 * (funkcja signInWithPassword). Jesli sie uda, Supabase zapisuje sesje
 * w ciasteczku przegladarki, a middleware.ts przy nastepnym zadaniu
 * przekierowuje uzytkownika na dashboard jego roli - nie musimy tego
 * robic recznie tutaj, wystarczy odswiezyc strone (router.refresh()).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError("Nieprawidłowy e-mail lub hasło. Spróbuj ponownie.");
      return;
    }

    router.refresh();
    router.push("/");
  }

  return (
    // Uwaga: celowo BEZ bg-background - tlo (gradient) ustawione jest raz,
    // globalnie, na <body> w globals.css.    
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Image src="/logo.png" alt="Contoso.com" width={160} height={80} priority />
          <p className="text-sm text-text-muted">
            Materiały elektryczne i budowlane · Panel CRM
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">E-mail</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-border bg-input-bg px-3 py-2 text-foreground outline-none focus:border-accent"
              placeholder="imie.nazwisko@contoso.com"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">Hasło</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-border bg-input-bg px-3 py-2 text-foreground outline-none focus:border-accent"
              placeholder="••••••••"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-accent px-4 py-2 font-medium text-white transition hover:bg-accent-strong disabled:opacity-60"
          >
            {loading ? "Logowanie…" : "Zaloguj się"}
          </button>
        </form>
      </div>
    </main>
  );
}
