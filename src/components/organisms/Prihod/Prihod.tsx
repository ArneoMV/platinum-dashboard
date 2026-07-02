"use client";

import { useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import styles from "./Prihod.module.scss";

type MjesecniPrihod = { mjesec: string; iznos: number };
type RegijaPrihod = { regija: string; iznos: number };

type PrihodProps = {
  mjeseci: MjesecniPrihod[];
  regije: RegijaPrihod[];
};

const MJESECI_KRATKO = [
  "Sij", "Velj", "Ožu", "Tra", "Svi", "Lip",
  "Srp", "Kol", "Ruj", "Lis", "Stu", "Pro",
];

function kratkiMjesec(kljuc: string): string {
  const mj = Number(kljuc.slice(5, 7));
  return MJESECI_KRATKO[mj - 1] ?? kljuc;
}

const eur0 = new Intl.NumberFormat("hr-HR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// "Is hydrated" detector: server snapshot is false (matches SSR), client snapshot
// true. Lets us defer the Recharts chart to the client with no hydration mismatch.
const emptySubscribe = () => () => {};

export default function Prihod({ mjeseci, regije }: PrihodProps) {
  // Recharts' ResponsiveContainer needs client dimensions; render it only after
  // hydration so SSR and first client render match (no mismatch / width-0 warning).
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const podaci = mjeseci.map((m) => ({ ...m, label: kratkiMjesec(m.mjesec) }));
  const maxRegija = Math.max(0, ...regije.map((r) => r.iznos));

  return (
    <div className={styles.prihod}>
      <section className={styles.blok}>
        <h4 className={styles.podnaslov}>Prihod po mjesecima</h4>
        <div className={styles.chart}>
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={podaci} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--line)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={{ stroke: "var(--line)" }}
                  tick={{ fontSize: 12, fill: "var(--ink-500)" }}
                />
                <YAxis
                  width={64}
                  tickFormatter={(v) => eur0.format(Number(v))}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--ink-500)" }}
                />
                <Tooltip
                  cursor={{ fill: "var(--accent-soft)" }}
                  formatter={(v) => [eur0.format(Number(v)), "Prihod"]}
                />
                <Bar dataKey="iznos" radius={[7, 7, 0, 0]} isAnimationActive={false}>
                  {podaci.map((d, i) => (
                    <Cell
                      key={d.mjesec}
                      fill={i === podaci.length - 1 ? "var(--accent)" : "var(--accent-tint)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={styles.chartPlaceholder} aria-hidden="true" />
          )}
        </div>
      </section>

      <section className={styles.blok}>
        <h4 className={styles.podnaslov}>Prodaja po regiji</h4>
        {regije.length === 0 ? (
          <p className={styles.prazno}>Nema podataka.</p>
        ) : (
          <ul className={styles.regije}>
            {regije.map((r) => (
              <li key={r.regija} className={styles.regijaRow}>
                <span className={styles.regijaNaziv}>{r.regija}</span>
                <span className={styles.traka}>
                  <span
                    className={styles.trakaFill}
                    style={{ width: `${maxRegija > 0 ? (r.iznos / maxRegija) * 100 : 0}%` }}
                  />
                </span>
                <span className={`${styles.regijaIznos} num`}>{eur0.format(r.iznos)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
