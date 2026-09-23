"use client";

/**
 * Klient Supabase do uzycia w komponentach przegladarkowych ("use client").
 *
 * Co to robi: tworzy polaczenie z baza Supabase korzystajac z dwoch
 * wartosci srodowiskowych (adres projektu i publiczny klucz "anon").
 * Te wartosci NIE sa tajne - anon key jest bezpieczny do uzycia w
 * przegladarce, bo prawdziwa ochrona danych dzieje sie w bazie przez
 * reguly RLS (Row Level Security) zdefiniowane w supabase/schema.sql.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
