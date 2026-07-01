import type { Metadata } from "next";

import DashboardHeader from "@/components/organisms/DashboardHeader/DashboardHeader";
import Container from "@/components/atoms/Container/Container";

import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Politika privatnosti — Platinum vina",
  description: "Politika privatnosti za interni alat tvrtke Platinum d.o.o.",
};

export default function PolitikaPrivatnosti() {
  return (
    <>
      <DashboardHeader company="Platinum d.o.o." />

      <main className={styles.main}>
        <Container>
          <article className={styles.doc}>
            <header className={styles.head}>
              <h1 className={styles.title}>Politika privatnosti</h1>
              <p className={styles.updated}>
                Datum zadnje izmjene: 30. lipnja 2026.
              </p>
            </header>

            <section className={styles.section}>
              <h2 className={styles.heading}>Tko smo</h2>
              <p className={styles.text}>
                Ova politika privatnosti odnosi se na interni alat tvrtke
                Platinum d.o.o. za pregled poslovanja i unos narudžbi. Alat
                koriste isključivo ovlašteni djelatnici tvrtke za interne
                poslovne potrebe; nije namijenjen javnosti niti krajnjim
                potrošačima.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.heading}>Koje podatke obrađujemo</h2>
              <ul className={styles.list}>
                <li>
                  Poslovne podatke o narudžbama, klijentima i vinima koji se
                  vode u internoj Google tablici.
                </li>
                <li>
                  Poruke koje ovlašteni korisnik pošalje putem WhatsApp-a radi
                  unosa novih narudžbi.
                </li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.heading}>Svrha obrade</h2>
              <p className={styles.text}>
                Podatke obrađujemo isključivo radi internog pregleda prodaje i
                unosa narudžbi. Ne koristimo ih u marketinške svrhe niti za
                profiliranje.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.heading}>WhatsApp poruke</h2>
              <p className={styles.text}>
                Kada ovlašteni korisnik pošalje poruku putem WhatsApp-a, sadržaj
                poruke obrađuje se radi izvlačenja podataka o narudžbi (primjerice
                naziv klijenta, iznos, broj stavki i kanal narudžbe) te se upisuje
                u internu Google tablicu.
              </p>
              <p className={styles.text}>
                Poruke se ne dijele s trećim stranama, osim sa servisima nužnima
                za rad alata (Meta/WhatsApp, Google i Anthropic za obradu teksta).
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.heading}>Pohrana i obrada podataka</h2>
              <ul className={styles.list}>
                <li>
                  <strong className={styles.strong}>Google</strong> — pohrana
                  poslovnih podataka i narudžbi u Google tablicama.
                </li>
                <li>
                  <strong className={styles.strong}>Anthropic</strong> — obrada
                  teksta poruka putem Anthropic Claude API-ja radi izvlačenja
                  podataka o narudžbi.
                </li>
                <li>
                  <strong className={styles.strong}>Meta / WhatsApp</strong> —
                  zaprimanje i slanje poruka putem WhatsApp Cloud API-ja.
                </li>
              </ul>
              <p className={styles.text}>
                Navedeni servisi obrađuju podatke samo u mjeri nužnoj za rad
                alata. Podatke ne prodajemo niti dijelimo s trećim stranama u
                marketinške svrhe.
              </p>
            </section>

            <section className={styles.section}>
              <h2 className={styles.heading}>Kontakt</h2>
              <p className={styles.text}>
                Za pitanja o ovoj politici privatnosti ili obradi podataka
                kontaktirajte nas na{" "}
                <a className={styles.link} href="mailto:kontakt@platinum-vina.hr">
                  kontakt@platinum-vina.hr
                </a>
                .
              </p>
            </section>
          </article>
        </Container>
      </main>
    </>
  );
}
