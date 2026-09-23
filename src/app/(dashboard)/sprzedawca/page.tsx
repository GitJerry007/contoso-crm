import { requireRole } from "@/lib/auth";
import { StatCard, Placeholder } from "@/components/dashboard-ui";

/**
 * Dashboard Sprzedawcy. Karty ponizej pokazuja na razie przykladowe
 * dane - w kolejnym kroku (po podlaczeniu Supabase) zamienimy je na
 * prawdziwe zapytania, np.:
 *
 *   const { data: zamowienia } = await supabase
 *     .from("zamowienia")
 *     .select("*, klient:klienci(nazwa)")
 *     .eq("handlowiec_id", profile.id);
 *
 * Dzieki regule RLS w bazie ("Sprzedawca widzi tylko swoje zamowienia")
 * to zapytanie samo zwroci wylacznie dane tego handlowca.
 */
export default async function SprzedawcaPage() {
  const { profile } = await requireRole("sprzedawca");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Witaj, {profile.full_name?.split(" ")[0] ?? ""} 👋
        </h1>
        <p className="text-sm text-text-muted">
          Twoi klienci i Twoje zamówienia - region {profile.region ?? "—"}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Moja sprzedaż w tym miesiącu" value="12 450 zł" />
        <StatCard label="Aktywne zamówienia" value="6" />
        <StatCard label="Klienci z rosnącym zadłużeniem" value="1" tone="warn" />
      </div>

      <Placeholder title="Moi klienci i status zamówień" />
      <Placeholder title="Moja sprzedaż w czasie" />
    </div>
  );
}
