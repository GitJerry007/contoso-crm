import { requireRole } from "@/lib/auth";
import { StatCard, Placeholder } from "@/components/dashboard-ui";

export default async function AdminPage() {
  await requireRole("administrator");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard ogólnofirmowy</h1>
        <p className="text-sm text-text-muted">Widok Administratora - wszystkie regiony i działy.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Sprzedaż firmy (miesiąc)" value="212 300 zł" />
        <StatCard label="Zaległe płatności" value="18 750 zł" tone="danger" />
        <StatCard label="Klienci w windykacji" value="4" tone="warn" />
        <StatCard label="Produkty poniżej minimum" value="2" tone="warn" />
      </div>

      <Placeholder title="Wartość sprzedaży w czasie" />
      <Placeholder title="Top 10 klientów i top produkty wg rotacji" />
    </div>
  );
}
