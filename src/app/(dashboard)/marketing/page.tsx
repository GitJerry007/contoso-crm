import { requireRole } from "@/lib/auth";
import { StatCard, Placeholder } from "@/components/dashboard-ui";

export default async function MarketingPage() {
  await requireRole("marketing");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard Marketingu / E-commerce</h1>
        <p className="text-sm text-text-muted">Dane o klientach i kanałach pozyskania - bez marż i windykacji.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Nowi klienci (miesiąc)" value="3" />
        <StatCard label="Najlepszy kanał pozyskania" value="Strona WWW" />
        <StatCard label="Klienci nieaktywni > 60 dni" value="2" tone="warn" />
      </div>

      <Placeholder title="Nowi klienci w czasie, z podziałem na kanał pozyskania" />
      <Placeholder title="Najlepiej sprzedające się produkty" />
    </div>
  );
}
