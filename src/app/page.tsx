/**
 * Strona glowna "/".
 *
 * W praktyce nikt jej nie zobaczy na dluzej: middleware.ts (patrz
 * src/middleware.ts) przechwytuje kazde wejscie na "/" i przekierowuje
 * od razu albo na /login (gosc), albo na dashboard wlasciwy dla roli
 * zalogowanej osoby. Ten plik to tylko krotki ekran "ladowania" na
 * wypadek ułamka sekundy zanim przekierowanie sie wykona.
 */
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-text-muted">Ładowanie…</p>
    </main>
  );
}
