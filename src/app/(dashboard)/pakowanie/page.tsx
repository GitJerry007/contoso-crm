import { requireRole } from "@/lib/auth";
import { StatCard, Placeholder } from "@/components/dashboard-ui";

export default async function PakowaniePage() {
  await requireRole("pakowanie");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard Pakowania / Magazynu</h1>
        <p className="text-sm text-text-muted">Bez cen i marż - tylko to, co potrzebne do spakowania.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Do spakowania dziś" value="4" />
        <StatCard label="W trakcie pakowania" value="2" />
        <StatCard label="Priorytetowe / ekspresowe" value="1" tone="warn" />
      </div>

      <Placeholder title="Kolejka „Do spakowania dziś” (od najstarszego zamówienia)" />
      <Placeholder title="Zsumowane zapotrzebowanie na produkty na dziś" />
    </div>
  );
}
