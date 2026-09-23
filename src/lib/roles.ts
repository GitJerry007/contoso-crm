/**
 * Role uzytkownikow w systemie CRM Contoso.com.
 *
 * To jest jedno, centralne miejsce ktore opisuje 6 rol z dokumentu analizy
 * ("Role i grupy uzytkownikow"). Kazda rola ma:
 *  - wartosc zapisywana w bazie (kolumna profiles.role),
 *  - czytelna etykiete PL do wyswietlenia w interfejsie,
 *  - adres URL swojego dashboardu (gdzie ma trafic po zalogowaniu).
 */

export const ROLES = [
  "sprzedawca",
  "kierownik_regionalny",
  "administrator",
  "ksiegowosc",
  "pakowanie",
  "marketing",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  sprzedawca: "Sprzedawca",
  kierownik_regionalny: "Kierownik regionalny",
  administrator: "Administrator",
  ksiegowosc: "Księgowość",
  pakowanie: "Pakowanie / Magazyn",
  marketing: "Marketing / E-commerce",
};

export const ROLE_HOME: Record<Role, string> = {
  sprzedawca: "/sprzedawca",
  kierownik_regionalny: "/kierownik",
  administrator: "/admin",
  ksiegowosc: "/ksiegowosc",
  pakowanie: "/pakowanie",
  marketing: "/marketing",
};

export function isRole(value: string | null | undefined): value is Role {
  return !!value && (ROLES as readonly string[]).includes(value);
}
