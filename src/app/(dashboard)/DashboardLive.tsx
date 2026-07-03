"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Card from "@/components/atoms/Card/Card";
import InsightCard from "@/components/molecules/InsightCard/InsightCard";
import KpiCard from "@/components/molecules/KpiCard/KpiCard";
import SyncBar from "@/components/molecules/SyncBar/SyncBar";
import Prihod from "@/components/organisms/Prihod/Prihod";
import Katalog from "@/components/organisms/Katalog/Katalog";
import type { Baza } from "@/lib/types";
import {
  prihodTekuciMjesec,
  brojNarudzbiTekuciMjesec,
  prosjekNarudzbeMjesec,
  klijentiZaKontakt,
  prihodPoMjesecima,
  prihodPoRegiji,
  marzaPoKategoriji,
  vinaNajnizaZaliha,
  zadnjaNarudzba,
  brojNarudzbiDanas,
} from "@/lib/metrics";

import styles from "./page.module.scss";

const eur = new Intl.NumberFormat("hr-HR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const POLL_MS = 30_000;

// Local-time DD.MM.YYYY. — consistent with the tables.
function formatDatum(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}.`;
}

// Croatian count plural: 1 → one, 2–4 → few, else → many.
function croPlural(n: number, one: string, few: string, many: string): string {
  const d1 = n % 10;
  const d2 = n % 100;
  if (d1 === 1 && d2 !== 11) return one;
  if (d1 >= 2 && d1 <= 4 && (d2 < 12 || d2 > 14)) return few;
  return many;
}

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

  // Home-overview insights (live, recomputed each poll).
  const insight = useMemo(
    () => ({
      najnizaZaliha: vinaNajnizaZaliha(baza.Vina, 3),
      zadnja: zadnjaNarudzba(baza.Narudzbe),
      brojDanas: brojNarudzbiDanas(baza.Narudzbe),
    }),
    [baza],
  );

  const zk = d.zaKontaktKlijenti;
  const najhitniji = zk[0];

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

      <div className={styles.stack}>
        {/* KPIs */}
        <Card title="Ključni pokazatelji" className={styles.kpiCardFull}>
          <div className={styles.kpiRow}>
            <KpiCard label="Prihod (mjesec)" value={eur.format(d.prihod)} />
            <KpiCard label="Narudžbe (mjesec)" value={String(d.broj)} />
            <KpiCard label="Prosjek narudžbe" value={eur.format(d.prosjek)} />
            <KpiCard
              label="Klijenti za kontakt"
              value={String(zk.length)}
              tone="attention"
            />
          </div>
        </Card>

        {/* Two main visuals */}
        <div className={styles.visuals}>
          <Card title="Prihod" eyebrow="Zadnjih 6 mjeseci">
            <Prihod mjeseci={d.mjeseci} regije={d.regije} />
          </Card>

          <Card title="Katalog" eyebrow="Po marži">
            <Katalog kategorije={d.kategorije} />
          </Card>
        </div>

        {/* Three insight cards */}
        <div className={styles.insights}>
          <InsightCard
            label="Klijenti"
            href="/klijenti"
            linkText="Vidi klijente"
            primary={
              zk.length === 0 ? (
                "Nema klijenata za kontakt"
              ) : (
                <>
                  <span className="num">{zk.length}</span>{" "}
                  {croPlural(zk.length, "klijent", "klijenta", "klijenata")} za kontakt
                </>
              )
            }
            secondary={
              zk.length === 0 || !najhitniji
                ? undefined
                : `najstariji: ${najhitniji.naziv} (${
                    Number.isFinite(najhitniji.dani)
                      ? `${najhitniji.dani} dana`
                      : "nikad"
                  })`
            }
          />

          <InsightCard
            label="Vina"
            href="/vina"
            linkText="Vidi vina"
            primary={
              insight.najnizaZaliha.length === 0 ? "Nema vina" : "Najniža zaliha"
            }
            secondary={
              insight.najnizaZaliha.length === 0
                ? undefined
                : insight.najnizaZaliha.map((v) => (
                    <span key={v.naziv} style={{ display: "block" }}>
                      {v.naziv} <span className="num">({v.zaliha} kom)</span>
                    </span>
                  ))
            }
          />

          <InsightCard
            label="Narudžbe"
            href="/narudzbe"
            linkText="Vidi narudžbe"
            primary={
              insight.brojDanas > 0 ? (
                <>
                  <span className="num">{insight.brojDanas}</span>{" "}
                  {croPlural(insight.brojDanas, "narudžba", "narudžbe", "narudžbi")}{" "}
                  danas
                </>
              ) : (
                "Zadnja narudžba"
              )
            }
            secondary={
              insight.zadnja
                ? `zadnja: ${insight.zadnja.klijent_naziv} · ${eur.format(
                    insight.zadnja.iznos,
                  )} · ${formatDatum(insight.zadnja.datum)}`
                : undefined
            }
          />
        </div>
      </div>
    </>
  );
}
