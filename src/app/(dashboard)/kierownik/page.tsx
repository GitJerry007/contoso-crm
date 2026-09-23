import { requireRole } from "@/lib/auth";
import { StatCard, Placeholder } from "@/components/dashboard-ui";

export default async function KierownikPage() {
  const { profile } = await requireRole("kierownik_regionalny");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard Kierownika regionalnego</h1>
        <p className="text-sm text-text-muted">Region: {profile.region ?? "—"}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Sprzedaż regionu (miesiąc)" value="86 900 zł" />
        <StatCard label="Klienci z zaległościami" value="3" tone="warn" />
        <StatCard label="Zamówienia utknięte > 5 dni" value="2" tone="danger" />
      </div>

      <Placeholder title="Ranking handlowców w regionie wg sprzedaży i marży" />
      <Placeholder title="Klienci z zaległościami w regionie" />
    </div>
  );
}
