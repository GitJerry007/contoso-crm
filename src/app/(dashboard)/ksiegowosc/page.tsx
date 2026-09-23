import { requireRole } from "@/lib/auth";
import { StatCard, Placeholder } from "@/components/dashboard-ui";

export default async function KsiegowoscPage() {
  await requireRole("ksiegowosc");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard Księgowości</h1>
        <p className="text-sm text-text-muted">Faktury, płatności i windykacja.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Prognoza wpływów (7 dni)" value="9 400 zł" />
        <StatCard label="Klienci nad limitem kredytowym" value="1" tone="warn" />
        <StatCard label="Skuteczność windykacji (miesiąc)" value="62%" tone="ok" />
      </div>

      <Placeholder title="Zaległe płatności (Klient / Zakup / Cena / Data zakupu / Dni po terminie)" />
      <Placeholder title="Nowy kontakt windykacyjny" hint="Tu trafi formularz - patrz kolejny krok (formularze)." />
    </div>
  );
}
