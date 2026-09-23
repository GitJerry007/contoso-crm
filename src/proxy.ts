import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Uwaga nazewnictwa: w tej wersji Next.js dawny plik "middleware.ts"
 * nazywa sie "proxy.ts" (funkcjonalnie to dokladnie to samo - kod
 * uruchamiany na serwerze przed kazdym zadaniem, PRZED renderowaniem
 * strony). Logike trzymamy w lib/supabase/middleware.ts, zeby nazwa
 * pliku nie byla myszaca.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Uruchom proxy dla wszystkich sciezek OPROCZ plikow statycznych
     * (obrazki, favicon, itp.) - nie ma sensu sprawdzac logowania przy
     * pobieraniu np. logo.png.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
