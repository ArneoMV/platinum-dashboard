import type { Metadata } from "next";
import { PT_Serif, Open_Sans } from "next/font/google";
import "./globals.scss";

const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  weight: ["400"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  weight: ["400", "600", "700"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Platinum vina — Dashboard",
  description: "Interni pregled poslovanja — Platinum vina.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hr" className={`${ptSerif.variable} ${openSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
