# Contoso.com - CRM Hurtowni

Aplikacja webowa CRM dla Contoso.com (hurtownia materiałów elektrycznych i
budowlanych) - kolejny etap projektu po analizie i prototypie w Airtable.
Stack: **Next.js** (interfejs) + **Supabase** (baza danych Postgres +
logowanie) + **Vercel** (docelowy hosting).

## Status

- ✅ Szkielet aplikacji (Next.js, TypeScript, Tailwind, branding Contoso.com)
- ✅ Baza danych w Supabase - 6 tabel + widoki + reguły RLS (patrz `supabase/schema.sql`)
- ✅ Strona logowania (`/login`) podłączona do Supabase Auth
- ✅ 6 stron dashboardów (jedna na rolę) z ochroną dostępu wg roli
- ⏳ Dashboardy pokazują na razie przykładowe dane - podłączenie do
  żywych danych z bazy to kolejny krok
- ⏳ Formularze (Nowe zamówienie, Nowy kontakt windykacyjny)
- ⏳ Wdrożenie na Vercel

## Jak to uruchomić lokalnie

```bash
npm install
cp .env.local.example .env.local   # i wklej prawdziwe wartosci (patrz nizej)
npm run dev
```

Aplikacja wystartuje na http://localhost:3000 i przekieruje Cię od razu
na `/login`.

## Zmienne środowiskowe

Projekt Supabase już istnieje (`contoso-crm`, region `eu-central-1`).
Wartości do `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://qiizmvskioasvjsedinz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_pU68c6CXnN48lKQhVm_clA__-ALGn3w
```

Te same dwie wartości trzeba będzie później wkleić w ustawieniach
projektu na Vercel (Environment Variables) - to NIE są tajne dane,
klucz "publishable" jest bezpieczny do użycia w przeglądarce (prawdziwa
ochrona danych jest w regułach RLS w bazie, nie w tym kluczu).

## Jak zalogować pierwszą osobę (Administratora)

System nie ma samodzielnej rejestracji (celowo - to wewnętrzne
narzędzie firmowe, konta zakłada administrator). Żeby zalogować się po
raz pierwszy:

1. Wejdź w Supabase Studio: https://supabase.com/dashboard/project/qiizmvskioasvjsedinz/auth/users
2. Kliknij **Add user** → **Create new user**, podaj e-mail i hasło,
   zaznacz "Auto Confirm User".
3. Skopiuj **User UID** nowo utworzonego konta.
4. W zakładce **SQL Editor** uruchom (podmieniając UID i dane):

   ```sql
   insert into public.profiles (id, full_name, role, region)
   values ('WKLEJ-TUTAJ-UID', 'Jan Kowalski', 'administrator', null);
   ```

   Dostępne wartości `role`: `sprzedawca`, `kierownik_regionalny`,
   `administrator`, `ksiegowosc`, `pakowanie`, `marketing`.

5. Zaloguj się w aplikacji tym e-mailem i hasłem - powinieneś trafić na
   dashboard administratora.

To jest ręczny krok "na start". W kolejnym etapie doda się prosty
ekran administratora do zapraszania nowych pracowników bez SQL Editora.

## Struktura projektu

```
src/
  app/
    login/            - strona logowania
    (dashboard)/       - wspólny layout + 6 stron dashboardów (jedna na rolę)
  components/          - współdzielone klocki UI (StatCard, Placeholder)
  lib/
    supabase/          - klienci Supabase (przeglądarka / serwer / proxy)
    roles.ts           - definicja 6 ról i ich adresów URL
    auth.ts            - requireUser() / requireRole() - ochrona stron
  proxy.ts              - odpowiednik dawnego middleware.ts: odświeża
                          sesję logowania i pilnuje przekierowań
supabase/
  schema.sql            - pełny schemat bazy (tabele, widoki, RLS) -
                          zastosowany już w prawdziwym projekcie Supabase
```

## Dlaczego niektóre rzeczy wyglądają "podwójnie zabezpieczone"

W trzech miejscach ta sama zasada jest sprawdzana i w kodzie strony
(`requireRole` w `lib/auth.ts`), i w bazie danych (reguły RLS w
`supabase/schema.sql`). To nie pomyłka: reguła w kodzie strony daje
ładne przekierowanie ("nie masz dostępu, wracasz na swój dashboard"),
a reguła w bazie jest tą, która NAPRAWDĘ chroni dane, nawet gdyby ktoś
ominął stronę i odpytał bazę bezpośrednio. To jest dokładnie ta różnica
między prototypem w Airtable a "prawdziwym wymuszeniem uprawnień", o
której mowa w dokumencie analizy.
