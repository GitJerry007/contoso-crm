/**
 * Wspólne, malutkie klocki UI używane na wszystkich dashboardach,
 * żeby nie powtarzać tego samego kodu w każdym pliku page.tsx.
 */

export function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "warn" | "danger" | "ok";
}) {
  const toneClass =
    tone === "warn"
      ? "text-amber-600"
      : tone === "danger"
      ? "text-red-600"
      : tone === "ok"
      ? "text-emerald-600"
      : "text-foreground";

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

export function Placeholder({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface p-6">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-text-muted">
        {hint ??
          "Tu pojawi się tabela / wykres podłączony do żywych danych z Supabase - kolejny krok po skonfigurowaniu bazy."}
      </p>
    </div>
  );
}
