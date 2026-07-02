"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Card from "@/components/atoms/Card/Card";
import KpiCard from "@/components/molecules/KpiCard/KpiCard";
import SyncBar from "@/components/molecules/SyncBar/SyncBar";
import ZaKontakt from "@/components/organisms/ZaKontakt/ZaKontakt";
import Prihod from "@/components/organisms/Prihod/Prihod";
import Katalog from "@/components/organisms/Katalog/Katalog";
import ZadnjeNarudzbe from "@/components/organisms/ZadnjeNarudzbe/ZadnjeNarudzbe";
import type { Baza } from "@/lib/types";
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

const POLL_MS = 30_000;

type DashboardLiveProps = {
  initialData: Baza;
};

export default function DashboardLive({ initialData }: DashboardLiveProps) {
  const [baza, setBaza] = useState<Baza>(initialData);
  const [lastUpdated, setLastUpdated] = useState<number>(() => Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  // Cheap change-detector: last serialized payload we committed to state.
  const serializedRef = useRef<string>(JSON.stringify(initialData));

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      // Pause while the tab is hidden — no pointless calls.
      if (document.visibilityState === "hidden") return;
      setIsRefreshing(true);
      try {
        const res = await fetch("/api/baza", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Partial<Baza> & { error?: string };
        // Error flag or malformed payload → keep last-known data.
        if (
          cancelled ||
          !Array.isArray(data.Klijenti) ||
          !Array.isArray(data.Vina) ||
          !Array.isArray(data.Narudzbe)
        ) {
          return;
        }
        const next: Baza = {
          Klijenti: data.Klijenti,
          Vina: data.Vina,
          Narudzbe: data.Narudzbe,
        };
        const serialized = JSON.stringify(next);
        if (serialized !== serializedRef.current) {
          serializedRef.current = serialized;
          setBaza(next);
          setPulseKey((k) => k + 1); // flash the sync dot only on a real change
        }
        setLastUpdated(Date.now());
      } catch {
        // Network hiccup — keep last-known data, retry next tick.
      } finally {
        if (!cancelled) setIsRefreshing(false);
      }
    }

    const timer = setInterval(poll, POLL_MS);
    // Resume immediately when the tab regains focus.
    function onVisibility() {
      if (document.visibilityState === "visible") poll();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Same derivations the server page used — metrics.ts is pure and client-safe.
  const d = useMemo(() => {
    const { Klijenti, Vina, Narudzbe } = baza;
    return {
      prihod: prihodTekuciMjesec(Narudzbe),
      broj: brojNarudzbiTekuciMjesec(Narudzbe),
      prosjek: prosjekNarudzbeMjesec(Narudzbe),
      zaKontaktKlijenti: klijentiZaKontakt(Klijenti, Narudzbe, 45),
      mjeseci: prihodPoMjesecima(Narudzbe, 6),
      regije: prihodPoRegiji(Narudzbe, Klijenti),
      kategorije: marzaPoKategoriji(Vina),
      narudzbe: Narudzbe,
    };
  }, [baza]);

  return (
    <>
      <div className={styles.syncWrap}>
        <SyncBar
          lastUpdated={lastUpdated}
          isRefreshing={isRefreshing}
          pulseKey={pulseKey}
        />
      </div>

      <div className={styles.pageHead}>
        <h1 className={styles.title}>Pregled</h1>
        <p className={styles.subtitle}>Platinum vina · interni pregled</p>
      </div>

      <div className={styles.grid}>
        <Card title="Ključni pokazatelji" className={styles.kpiCardFull}>
          <div className={styles.kpiRow}>
            <KpiCard label="Prihod (mjesec)" value={eur.format(d.prihod)} />
            <KpiCard label="Narudžbe (mjesec)" value={String(d.broj)} />
            <KpiCard label="Prosjek narudžbe" value={eur.format(d.prosjek)} />
            <KpiCard
              label="Klijenti za kontakt"
              value={String(d.zaKontaktKlijenti.length)}
              tone="attention"
            />
          </div>
        </Card>

        <div className={styles.col}>
          <Card title="Za kontakt" eyebrow="Auto-podsjetnik">
            <ZaKontakt clients={d.zaKontaktKlijenti} />
          </Card>

          <Card title="Katalog" eyebrow="Po marži">
            <Katalog kategorije={d.kategorije} />
          </Card>
        </div>

        <div className={styles.col}>
          <Card title="Prihod" eyebrow="Zadnjih 6 mjeseci">
            <Prihod mjeseci={d.mjeseci} regije={d.regije} />
          </Card>

          <Card title="Zadnje narudžbe" eyebrow="Uživo">
            <ZadnjeNarudzbe narudzbe={d.narudzbe} />
          </Card>
        </div>
      </div>
    </>
  );
}
