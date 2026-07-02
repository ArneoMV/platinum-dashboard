import DashboardHeader from "@/components/organisms/DashboardHeader/DashboardHeader";
import Container from "@/components/atoms/Container/Container";
import Card from "@/components/atoms/Card/Card";
import SyncBar from "@/components/molecules/SyncBar/SyncBar";
import KpiCard from "@/components/molecules/KpiCard/KpiCard";
import ZaKontakt from "@/components/organisms/ZaKontakt/ZaKontakt";
import Prihod from "@/components/organisms/Prihod/Prihod";
import Katalog from "@/components/organisms/Katalog/Katalog";
import ZadnjeNarudzbe from "@/components/organisms/ZadnjeNarudzbe/ZadnjeNarudzbe";
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
          <div className={styles.syncWrap}>
            <SyncBar />
          </div>

          <div className={styles.pageHead}>
            <h1 className={styles.title}>Pregled</h1>
            <p className={styles.subtitle}>Platinum vina · interni pregled</p>
          </div>

          <div className={styles.grid}>
            <Card
              title="Ključni pokazatelji"
              className={styles.kpiCardFull}
              scroll={false}
            >
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

            <div className={styles.col}>
              <Card title="Za kontakt" eyebrow="Auto-podsjetnik">
                <ZaKontakt clients={zaKontaktKlijenti} />
              </Card>

              <Card title="Katalog" eyebrow="Po marži">
                <Katalog kategorije={kategorije} />
              </Card>
            </div>

            <div className={styles.col}>
              <Card title="Prihod" eyebrow="Zadnjih 6 mjeseci">
                <Prihod mjeseci={mjeseci} regije={regije} />
              </Card>

              <Card title="Zadnje narudžbe" eyebrow="Uživo" scroll={false}>
                <ZadnjeNarudzbe narudzbe={Narudzbe} />
              </Card>
            </div>
          </div>
        </Container>
      </main>
    </>
  );
}
