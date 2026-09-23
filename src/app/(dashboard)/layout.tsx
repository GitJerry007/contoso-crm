/**
 * Wspolny "plaszcz" (layout) dla wszystkich dashboardow: logo w rogu,
 * badge z rola i imieniem zalogowanej osoby, przycisk wylogowania.
 * Zawartosc kazdej konkretnej strony (np. sprzedawca/page.tsx) wchodzi
 * w miejsce {children}.
 *
 * Uwaga: to jest "Server Component" - dane o uzytkowniku pobierane sa
 * na serwerze zanim strona w ogole trafi do przegladarki (requireUser()
 * w lib/auth.ts). Jesli ktos nie jest zalogowany, requireUser sam
 * przekieruje na /login - nie trzeba tego pilnowac tutaj.
 */

import Image from "next/image";
import { requireUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/roles";
import { signOut } from "./actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireUser();

  return (
    // Uwaga: celowo BEZ bg-background tutaj - tlo (gradient) ustawione
    // jest raz, globalnie, na <body> w globals.css. Gdyby ten div mial
    // wlasne plaskie tlo, zakrywalby ten gradient.
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Contoso.com" width={120} height={60} priority />
          <span className="hidden text-sm text-text-muted sm:inline">
            Materiały elektryczne i budowlane · Panel CRM
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{profile.full_name}</p>
            <p className="text-xs text-text-muted">
              {ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS]}
              {profile.region ? ` · ${profile.region}` : ""}
            </p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted transition hover:border-accent hover:text-accent"
            >
              Wyloguj
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}