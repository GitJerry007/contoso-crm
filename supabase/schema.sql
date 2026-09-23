-- =====================================================================
-- Contoso.com CRM - schemat bazy danych (Postgres / Supabase)
-- =====================================================================
-- Ten plik to KOPIA tego, co zostalo zastosowane w projekcie Supabase
-- przez narzedzia MCP (apply_migration) - trzymamy go w repozytorium,
-- zeby cala struktura bazy byla widoczna w kodzie (wersjonowana w git),
-- a nie tylko "gdzies w chmurze". W razie potrzeby mozna go tez wkleic
-- recznie w Supabase Studio -> SQL Editor (kolejnosc w tym pliku jest
-- wazna - najpierw wszystkie tabele, potem widoki, ktore je licza).
--
-- Struktura odpowiada 1:1 analizie z dokumentu "CRM Hurtownia - analiza
-- i plan rozwoju" (Czesc 1: Ocena obecnej struktury / Role i uprawnienia).
-- Sześć "tabel" z Airtable = szesc tabel tutaj:
--   Handlowcy           -> profiles (polaczone z kontem logowania auth.users)
--   Klienci             -> klienci
--   Zamowienia          -> zamowienia
--   Produkty i Magazyn  -> produkty
--   Faktury i Platnosci -> faktury
--   Windykacja          -> windykacja
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ENUMY (odpowiedniki pol "Select" z Airtable - ograniczaja wartosci
--    do konkretnej listy, tak samo jak listy wyboru w Airtable)
-- ---------------------------------------------------------------------

create type public.rola as enum (
  'sprzedawca',
  'kierownik_regionalny',
  'administrator',
  'ksiegowosc',
  'pakowanie',
  'marketing'
);

create type public.kraj as enum ('PL', 'CZ', 'SK', 'HU', 'DE');

create type public.kanal_pozyskania as enum (
  'Handlowiec', 'Strona WWW', 'Allegro / marketplace', 'Polecenie', 'Targi'
);

create type public.zrodlo_zamowienia as enum ('Bezpośrednio', 'Handlowiec');

create type public.status_zamowienia as enum (
  'Nowe', 'W realizacji', 'Wysyłane', 'Zakończone'
);

create type public.status_pakowania as enum (
  'Czeka', 'W pakowaniu', 'Spakowane', 'Wysłane'
);

create type public.metoda_platnosci as enum (
  'Przelew', 'Karta', 'Gotówka', 'BLIK', 'Pobranie'
);

create type public.rodzaj_kontaktu as enum ('SMS', 'E-mail', 'Telefon', 'Wezwanie');

create type public.status_windykacji as enum (
  'Monitoring', 'SMS', 'Wezwanie', 'Eskalacja', 'Zamknięta'
);

-- ---------------------------------------------------------------------
-- 2. PROFILES (odpowiednik tabeli Handlowcy/Pracownicy)
-- ---------------------------------------------------------------------
-- Kazdy wiersz jest POLACZONY 1:1 z kontem logowania w Supabase Auth
-- (auth.users). To auth.users trzyma haslo i obsluguje logowanie;
-- profiles trzyma dane biznesowe: imie, role, region, czy konto aktywne.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.rola not null,
  region public.kraj,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.profiles is
  'Pracownicy Contoso.com - odpowiednik tabeli Handlowcy z Airtable. Jeden wiersz = jedno konto logowania.';

-- Funkcje pomocnicze SECURITY DEFINER: czytaja WLASNA role/region
-- zalogowanej osoby z pominieciem RLS (zeby uniknac rekurencji przy
-- sprawdzaniu regul RLS na samej tabeli profiles) i sa uzywane w
-- politykach ponizej oraz w kolejnych tabelach.

create function public.current_user_role()
returns public.rola
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.current_user_region()
returns public.kraj
language sql
security definer
stable
set search_path = public
as $$
  select region from public.profiles where id = auth.uid();
$$;

alter table public.profiles enable row level security;

create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_self_or_admin"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.current_user_role() = 'administrator');

create policy "profiles_insert_admin"
  on public.profiles for insert
  to authenticated
  with check (public.current_user_role() = 'administrator');

create policy "profiles_delete_admin"
  on public.profiles for delete
  to authenticated
  using (public.current_user_role() = 'administrator');

-- ---------------------------------------------------------------------
-- 3. KLIENCI
-- ---------------------------------------------------------------------

create table public.klienci (
  id uuid primary key default gen_random_uuid(),
  nazwa text not null,
  id_klienta text unique,
  nip text,
  kraj public.kraj not null default 'PL',
  telefon text,
  email text,
  limit_kredytowy numeric(12, 2) not null default 0,
  termin_platnosci_dni integer not null default 14,
  status_klienta text not null default 'Aktywny',
  handlowiec_id uuid references public.profiles (id),
  kanal_pozyskania public.kanal_pozyskania,
  created_at timestamptz not null default now()
);

comment on table public.klienci is
  'Klienci hurtowni - odpowiednik tabeli Klienci z Airtable.';

alter table public.klienci enable row level security;

-- Sprzedawca: tylko swoi klienci. Kierownik: caly swoj region.
-- Administrator / ksiegowosc / marketing: wszyscy klienci (kazdy z tych
-- dzialow potrzebuje pelnego wgladu w klientow z innego powodu:
-- ksiegowosc - limity kredytowe, marketing - kanaly pozyskania).
-- Pakowanie: brak dostepu (nie jest im do niczego potrzebny).
create policy "klienci_select"
  on public.klienci for select
  to authenticated
  using (
    public.current_user_role() in ('administrator', 'ksiegowosc', 'marketing')
    or (public.current_user_role() = 'sprzedawca' and handlowiec_id = auth.uid())
    or (public.current_user_role() = 'kierownik_regionalny' and kraj = public.current_user_region())
  );

create policy "klienci_insert"
  on public.klienci for insert
  to authenticated
  with check (
    public.current_user_role() in ('administrator', 'sprzedawca', 'kierownik_regionalny')
  );

create policy "klienci_update"
  on public.klienci for update
  to authenticated
  using (
    public.current_user_role() = 'administrator'
    or (public.current_user_role() = 'sprzedawca' and handlowiec_id = auth.uid())
    or (public.current_user_role() = 'kierownik_regionalny' and kraj = public.current_user_region())
  );

-- ---------------------------------------------------------------------
-- 4. PRODUKTY (Produkty i Magazyn)
-- ---------------------------------------------------------------------

create table public.produkty (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  nazwa text not null,
  kategoria text not null default 'Pozostałe',
  dostawca text,
  stan_magazynowy integer not null default 0,
  stan_minimalny integer not null default 0,
  cena_zakupu numeric(12, 2) not null default 0,
  cena_sprzedazy numeric(12, 2) not null default 0,
  marza_procent numeric(6, 2) generated always as (
    case
      when cena_sprzedazy = 0 then 0
      else round(((cena_sprzedazy - cena_zakupu) / cena_sprzedazy) * 100, 2)
    end
  ) stored,
  created_at timestamptz not null default now()
);

comment on table public.produkty is
  'Katalog produktow i stan magazynowy - odpowiednik tabeli Produkty i Magazyn z Airtable.';

alter table public.produkty enable row level security;

-- Wszyscy oprocz pakowania widza pelna tabele (z cenami). Pakowanie
-- korzysta z widoku v_produkty_pakowanie (patrz sekcja WIDOKI), ktory
-- NIE pokazuje cen ani marzy - to jest prawdziwe (nie tylko "na oko")
-- wymuszenie uprawnien, ktorego nie dalo sie zrobic w darmowym Airtable.
create policy "produkty_select"
  on public.produkty for select
  to authenticated
  using (public.current_user_role() <> 'pakowanie');

create policy "produkty_write_admin"
  on public.produkty for all
  to authenticated
  using (public.current_user_role() = 'administrator')
  with check (public.current_user_role() = 'administrator');

-- ---------------------------------------------------------------------
-- 5. ZAMOWIENIA
-- ---------------------------------------------------------------------

create table public.zamowienia (
  id uuid primary key default gen_random_uuid(),
  numer_zamowienia text,
  klient_id uuid not null references public.klienci (id),
  handlowiec_id uuid references public.profiles (id),
  produkt_id uuid not null references public.produkty (id),
  ilosc integer not null check (ilosc > 0),
  cena_sprzedazy numeric(12, 2) not null,
  wartosc_zamowienia numeric(14, 2) generated always as (ilosc * cena_sprzedazy) stored,
  zrodlo public.zrodlo_zamowienia not null default 'Bezpośrednio',
  status public.status_zamowienia not null default 'Nowe',
  status_pakowania public.status_pakowania not null default 'Czeka',
  uwagi text,
  data_zamowienia timestamptz not null default now()
);

comment on table public.zamowienia is
  'Zamowienia - odpowiednik tabeli Zamowienia z Airtable. Jeden wiersz = jedna pozycja towarowa (tak jak w oryginalnej bazie).';

alter table public.zamowienia enable row level security;

create policy "zamowienia_select"
  on public.zamowienia for select
  to authenticated
  using (
    public.current_user_role() in ('administrator', 'ksiegowosc')
    or (public.current_user_role() = 'sprzedawca' and handlowiec_id = auth.uid())
    or (
      public.current_user_role() = 'kierownik_regionalny'
      and klient_id in (select id from public.klienci where kraj = public.current_user_region())
    )
    -- Pakowanie NIE dostaje dostepu do tej tabeli wprost (ma ceny) -
    -- korzysta z widoku v_zamowienia_pakowanie bez cen (patrz WIDOKI).
  );

create policy "zamowienia_insert"
  on public.zamowienia for insert
  to authenticated
  with check (
    public.current_user_role() in ('administrator', 'sprzedawca', 'kierownik_regionalny')
  );

create policy "zamowienia_update_own_or_admin"
  on public.zamowienia for update
  to authenticated
  using (
    public.current_user_role() = 'administrator'
    or (public.current_user_role() = 'sprzedawca' and handlowiec_id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- 6. FAKTURY I PLATNOSCI
-- ---------------------------------------------------------------------

create table public.faktury (
  id uuid primary key default gen_random_uuid(),
  numer_faktury text unique not null,
  klient_id uuid not null references public.klienci (id),
  zamowienie_id uuid references public.zamowienia (id),
  data_faktury date not null default current_date,
  termin_platnosci date not null,
  kwota_faktury numeric(12, 2) not null,
  zaplacono numeric(12, 2) not null default 0,
  pozostalo numeric(12, 2) generated always as (kwota_faktury - zaplacono) stored,
  metoda_platnosci public.metoda_platnosci,
  data_zaplaty date,
  created_at timestamptz not null default now()
);

comment on table public.faktury is
  'Faktury i platnosci - odpowiednik tabeli Faktury i Platnosci z Airtable. Status platnosci i dni po terminie licza sie na zywo w widoku v_faktury (bo zalezą od dzisiejszej daty).';

alter table public.faktury enable row level security;

create policy "faktury_select"
  on public.faktury for select
  to authenticated
  using (
    public.current_user_role() in ('administrator', 'ksiegowosc')
    or (
      public.current_user_role() = 'sprzedawca'
      and klient_id in (select id from public.klienci where handlowiec_id = auth.uid())
    )
    or (
      public.current_user_role() = 'kierownik_regionalny'
      and klient_id in (select id from public.klienci where kraj = public.current_user_region())
    )
  );

create policy "faktury_write_ksiegowosc"
  on public.faktury for all
  to authenticated
  using (public.current_user_role() in ('administrator', 'ksiegowosc'))
  with check (public.current_user_role() in ('administrator', 'ksiegowosc'));

-- ---------------------------------------------------------------------
-- 7. WINDYKACJA
-- ---------------------------------------------------------------------
-- Kazdy wiersz to JEDEN kontakt z dluznikiem (tak jak w Airtable) -
-- historia buduje sie sama przez dopisywanie kolejnych wierszy.

create table public.windykacja (
  id uuid primary key default gen_random_uuid(),
  sprawa text,
  klient_id uuid not null references public.klienci (id),
  faktura_id uuid references public.faktury (id),
  odpowiedzialny_id uuid references public.profiles (id),
  rodzaj_kontaktu public.rodzaj_kontaktu not null,
  status_windykacji public.status_windykacji not null default 'Monitoring',
  data_kontaktu date not null default current_date,
  nastepne_przypomnienie date,
  notatka text,
  created_at timestamptz not null default now()
);

comment on table public.windykacja is
  'Historia kontaktow windykacyjnych - odpowiednik tabeli Windykacja z Airtable.';

alter table public.windykacja enable row level security;

create policy "windykacja_select_ksiegowosc_admin"
  on public.windykacja for select
  to authenticated
  using (public.current_user_role() in ('administrator', 'ksiegowosc'));

create policy "windykacja_write_ksiegowosc_admin"
  on public.windykacja for all
  to authenticated
  using (public.current_user_role() in ('administrator', 'ksiegowosc'))
  with check (public.current_user_role() in ('administrator', 'ksiegowosc'));

-- =====================================================================
-- WIDOKI - licza pola "automatyczne" (odpowiedniki Rollup/Formula z
-- Airtable) na podstawie danych z kilku tabel naraz. Musza powstac PO
-- utworzeniu wszystkich tabel powyzej, bo licza dane z kilku z nich.
-- =====================================================================

-- Klienci + aktualne_zadluzenie (suma niezaplaconych faktur klienta).
create view public.v_klienci
with (security_invoker = true) as
select
  k.*,
  coalesce(f.suma_do_zaplaty, 0) as aktualne_zadluzenie
from public.klienci k
left join (
  select klient_id, sum(kwota_faktury - zaplacono) as suma_do_zaplaty
  from public.faktury
  group by klient_id
) f on f.klient_id = k.id;

comment on view public.v_klienci is
  'Klienci + aktualne_zadluzenie liczone na zywo z niezaplaconych faktur (odpowiednik Rollup w Airtable).';

-- Produkty + zarezerwowane (suma ilosci z aktywnych zamowien) +
-- dostepne (stan_magazynowy - zarezerwowane).
create view public.v_produkty
with (security_invoker = true) as
select
  p.*,
  coalesce(z.suma_zarezerwowana, 0) as zarezerwowane,
  p.stan_magazynowy - coalesce(z.suma_zarezerwowana, 0) as dostepne
from public.produkty p
left join (
  select produkt_id, sum(ilosc) as suma_zarezerwowana
  from public.zamowienia
  where status <> 'Zakończone'
  group by produkt_id
) z on z.produkt_id = p.id;

comment on view public.v_produkty is
  'Produkty + zarezerwowane/dostepne liczone na zywo z aktywnych zamowien (odpowiednik Rollup + Formula w Airtable).';

-- Wersja dla roli Pakowanie: bez cen i marzy.
create view public.v_produkty_pakowanie
with (security_invoker = true) as
select id, sku, nazwa, kategoria, stan_magazynowy, stan_minimalny
from public.produkty;

grant select on public.v_produkty_pakowanie to authenticated;

-- Zamowienia dla roli Pakowanie: bez cen i wartosci - tylko to, co
-- potrzebne do spakowania paczki.
create view public.v_zamowienia_pakowanie
with (security_invoker = true) as
select
  z.id,
  z.numer_zamowienia,
  z.status,
  z.status_pakowania,
  z.ilosc,
  z.data_zamowienia,
  p.nazwa as produkt,
  p.sku,
  k.nazwa as klient
from public.zamowienia z
join public.produkty p on p.id = z.produkt_id
join public.klienci k on k.id = z.klient_id;

grant select on public.v_zamowienia_pakowanie to authenticated;

-- Faktury + dni_po_terminie i status_platnosci liczone NA ZYWO (nie
-- moga byc "generated column", bo zaleza od dzisiejszej daty, ktora
-- sie zmienia - stad widok, a nie zwykla kolumna).
create view public.v_faktury
with (security_invoker = true) as
select
  f.*,
  case
    when f.pozostalo <= 0 then 'Zapłacona'
    when current_date > f.termin_platnosci then 'Po terminie'
    else 'Oczekuje'
  end as status_platnosci,
  greatest(0, current_date - f.termin_platnosci) as dni_po_terminie
from public.faktury f;

comment on view public.v_faktury is
  'Faktury + status_platnosci/dni_po_terminie liczone na zywo wzgledem dzisiejszej daty (odpowiednik Formula w Airtable).';

-- =====================================================================
-- FUNKCJA: bezpieczna zmiana statusu pakowania
-- =====================================================================
-- Zamiast dawac roli Pakowanie prawo UPDATE na calej tabeli zamowienia
-- (co pozwolliloby jej przy okazji zmienic cene czy klienta), dajemy
-- jej dostep TYLKO do tej jednej funkcji. To dokladnie odwzorowuje
-- wiersz z tabeli rol w dokumencie analizy:
--   "Pracownik pakujący - Może edytować: Wyłącznie pole Status pakowania".
create function public.ustaw_status_pakowania(
  p_zamowienie_id uuid,
  p_status public.status_pakowania
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() not in ('pakowanie', 'administrator') then
    raise exception 'Brak uprawnien do zmiany statusu pakowania';
  end if;

  update public.zamowienia
  set status_pakowania = p_status
  where id = p_zamowienie_id;
end;
$$;

grant execute on function public.ustaw_status_pakowania(uuid, public.status_pakowania) to authenticated;

-- ---------------------------------------------------------------------
-- Docciagniecie uprawnien: domyslnie Postgres nadaje EXECUTE na nowe
-- funkcje roli PUBLIC (czyli takze niezalogowanym "anon"). Odbieramy to
-- dla naszych funkcji pomocniczych - maja dzialac tylko dla zalogowanych.
-- (Supabase Security Advisor to wylapal - apply_migration + get_advisors
-- to dobra para: po kazdej zmianie struktury warto sprawdzic advisories).
-- ---------------------------------------------------------------------
revoke execute on function public.current_user_role() from public, anon;
revoke execute on function public.current_user_region() from public, anon;
revoke execute on function public.ustaw_status_pakowania(uuid, public.status_pakowania) from public, anon;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_user_region() to authenticated;
