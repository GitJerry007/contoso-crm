/**
 * Logika uzywana przez middleware.ts (patrz plik w katalogu glownym src/).
 *
 * Co to robi, po ludzku:
 * 1. Przy kazdym zadaniu do serwera odswieza sesje logowania (Supabase
 *    Auth uzywa tokenow ktore trzeba co jakis czas odnawiac).
 * 2. Jesli ktos nie jest zalogowany i probuje wejsc na strone dashboardu,
 *    przekierowuje go na /login.
 * 3. Jesli ktos jest zalogowany i wchodzi na / albo /login, przekierowuje
 *    go od razu na dashboard jego roli.
 *
 * To jest "pierwsza linia obrony" - dziala na poziomie tras (URL).
 * Druga, wazniejsza linia obrony to reguly RLS w bazie danych
 * (supabase/schema.sql) - one pilnuja danych, nawet gdyby ktos ominal
 * strone logowania.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ROLE_HOME, isRole } from "@/lib/roles";

const PUBLIC_PATHS = ["/login", "/auth"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && (path === "/" || path === "/login")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;
    const url = request.nextUrl.clone();
    url.pathname = isRole(role) ? ROLE_HOME[role] : "/login";
    return NextResponse.redirect(url);
  }

  return response;
}
