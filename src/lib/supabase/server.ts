/**
 * Klient Supabase do uzycia po stronie serwera (Server Components,
 * Server Actions, middleware).
 *
 * Roznica wzgledem client.ts: ten klient czyta i zapisuje sesje
 * uzytkownika w ciasteczkach (cookies), zeby Next.js na serwerze
 * wiedzial "kto pyta" jeszcze zanim strona trafi do przegladarki.
 * Dzieki temu strony dashboardow moga od razu pobierac dane
 * przypisane do zalogowanej osoby (np. "tylko moi klienci").
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as CookieOptions)
            );
          } catch {
            // setAll wywolane z Server Component - middleware.ts i tak
            // odswieza sesje przy kazdym zadaniu, wiec mozna to zignorowac.
          }
        },
      },
    }
  );
}
