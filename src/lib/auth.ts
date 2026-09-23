/**
 * Pomocnicze funkcje serwerowe do sprawdzania "kto jest zalogowany
 * i jaka ma role" - uzywane na poczatku kazdej strony dashboardu.
 *
 * requireUser()  -> zwraca zalogowanego uzytkownika + jego profil
 *                    (imie, rola) albo przekierowuje na /login.
 * requireRole()  -> jak wyzej, ale dodatkowo sprawdza czy rola
 *                    zgadza sie z ta wymagana przez strone (np.
 *                    strona /admin wymaga roli "administrator").
 *                    Jesli nie - odsyla uzytkownika na JEGO WLASNY
 *                    dashboard, zamiast pokazac mu cudze dane.
 *
 * To jest wygoda po stronie interfejsu. Prawdziwa, nie-do-obejscia
 * ochrona danych i tak dzieje sie w bazie danych przez reguly RLS
 * (supabase/schema.sql) - nawet gdyby ktos wszedl na zly URL, zapytania
 * do bazy i tak zwroca tylko to, do czego ma prawo.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME, type Role, isRole } from "@/lib/roles";

export async function requireUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, region, active")
    .eq("id", user.id)
    .single();

  if (!profile || !isRole(profile.role)) {
    redirect("/login");
  }

  return { supabase, user, profile };
}

export async function requireRole(expected: Role) {
  const ctx = await requireUser();

  if (ctx.profile.role !== expected) {
    redirect(ROLE_HOME[ctx.profile.role as Role]);
  }

  return ctx;
}
