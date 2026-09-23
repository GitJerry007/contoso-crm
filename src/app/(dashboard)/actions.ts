"use server";

/**
 * Server Action wylogowania. Przyciski w interfejsie ("Wyloguj") wolaja
 * ta funkcje bezposrednio - nie trzeba do tego osobnego API route.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
