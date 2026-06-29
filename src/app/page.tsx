import DashboardHeader from "@/components/organisms/DashboardHeader/DashboardHeader";
import Container from "@/components/atoms/Container/Container";
import Card from "@/components/atoms/Card/Card";
import KpiCard from "@/components/molecules/KpiCard/KpiCard";
import ZaKontakt from "@/components/organisms/ZaKontakt/ZaKontakt";
import Prihod from "@/components/organisms/Prihod/Prihod";
import Katalog from "@/components/organisms/Katalog/Katalog";
import { getBaza } from "@/lib/data";
import {
  prihodTekuciMjesec,
  brojNarudzbiTekuciMjesec,
  prosjekNarudzbeMjesec,
  klijentiZaKontakt,
  prihodPoMjesecima,
  prihodPoRegiji,
  marzaPoKategoriji,
} from "@/lib/metrics";
import styles from "./page.module.scss";

const placeholderSections = ["Zadnje narudžbe"];

const eur = new Intl.NumberFormat("hr-HR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default async function Home() {
  const { Klijenti, Vina, Narudzbe } = await getBaza();

  const prihod = prihodTekuciMjesec(Narudzbe);
  const broj = brojNarudzbiTekuciMjesec(Narudzbe);
  const prosjek = prosjekNarudzbeMjesec(Narudzbe);
  const zaKontaktKlijenti = klijentiZaKontakt(Klijenti, Narudzbe, 45);
  const mjeseci = prihodPoMjesecima(Narudzbe, 6);
  const regije = prihodPoRegiji(Narudzbe, Klijenti);
  const kategorije = marzaPoKategoriji(Vina);

  return (
    <>
      <DashboardHeader company="Platinum d.o.o." />

      <main className={styles.main}>
        <Container>
          <div className={styles.pageHead}>
            <h1 className={styles.title}>Pregled</h1>
            <p className={styles.subtitle}>Platinum vina · interni pregled</p>
          </div>

          <div className={styles.grid}>
            <Card title="Ključni pokazatelji" className={styles.kpiCardFull}>
              <div className={styles.kpiRow}>
                <KpiCard label="Prihod (mjesec)" value={eur.format(prihod)} />
                <KpiCard label="Narudžbe (mjesec)" value={String(broj)} />
                <KpiCard label="Prosjek narudžbe" value={eur.format(prosjek)} />
                <KpiCard
                  label="Klijenti za kontakt"
                  value={String(zaKontaktKlijenti.length)}
                  tone="attention"
                />
              </div>
            </Card>

            <Card title="Za kontakt">
              <ZaKontakt clients={zaKontaktKlijenti} />
            </Card>

            <Card title="Prihod">
              <Prihod mjeseci={mjeseci} regije={regije} />
            </Card>

            <Card title="Katalog">
              <Katalog kategorije={kategorije} />
            </Card>

            {placeholderSections.map((section) => (
              <Card key={section} title={section}>
                <p className={styles.soon}>uskoro</p>
              </Card>
            ))}
          </div>
        </Container>
      </main>
    </>
  );
}
