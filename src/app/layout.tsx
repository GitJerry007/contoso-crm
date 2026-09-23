import type { Metadata } from "next";
import "./globals.css";

/**
 * Uwaga: celowo NIE uzywamy tu next/font/google (np. Geist) - pobieranie
 * fontow z Google w trakcie builda czasem zawodzi w srodowiskach z
 * ograniczonym dostepem do sieci (tak jak ten sandbox). Zamiast tego
 * korzystamy z fontow systemowych zdefiniowanych w globals.css - dziala
 * wszedzie, bez zaleznosci od zewnetrznej sieci.
 */

export const metadata: Metadata = {
  title: "Contoso.com - CRM Hurtowni",
  description:
    "System CRM dla hurtowni materiałów elektrycznych i budowlanych Contoso.com - zamówienia, magazyn, windykacja i dashboardy per rola.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
