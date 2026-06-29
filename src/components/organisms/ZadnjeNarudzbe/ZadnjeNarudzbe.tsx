"use client";

import { useMemo, useState } from "react";

import Badge from "@/components/atoms/Badge/Badge";
import type { Narudzba } from "@/lib/types";
import styles from "./ZadnjeNarudzbe.module.scss";

type ZadnjeNarudzbeProps = {
  narudzbe: Narudzba[];
};

type SortKey = "datum" | "klijent" | "stavke" | "iznos" | "kanal";
type SortDir = "asc" | "desc";

const eur = new Intl.NumberFormat("hr-HR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Local-time DD.MM.YYYY. — matches the metrics module, which buckets by local date.
function formatDatum(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}.`;
}

const columns: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: "datum", label: "Datum", numeric: false },
  { key: "klijent", label: "Klijent", numeric: false },
  { key: "stavke", label: "Stavke", numeric: true },
  { key: "iznos", label: "Iznos", numeric: true },
  { key: "kanal", label: "Kanal", numeric: false },
];

export default function ZadnjeNarudzbe({ narudzbe }: ZadnjeNarudzbeProps) {
  const [sortKey, setSortKey] = useState<SortKey>("datum");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const arr = [...narudzbe];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "datum":
          cmp = new Date(a.datum).getTime() - new Date(b.datum).getTime();
          break;
        case "klijent":
          cmp = a.klijent_naziv.localeCompare(b.klijent_naziv, "hr");
          break;
        case "stavke":
          cmp = a.stavke - b.stavke;
          break;
        case "iznos":
          cmp = a.iznos - b.iznos;
          break;
        case "kanal":
          cmp = a.kanal.localeCompare(b.kanal, "hr");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [narudzbe, sortKey, sortDir]);

  function onSort(col: { key: SortKey; numeric: boolean }) {
    if (col.key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col.key);
      // Sensible default per type: newest/largest first for date & numbers, A→Z for text.
      setSortDir(col.numeric || col.key === "datum" ? "desc" : "asc");
    }
  }

  if (narudzbe.length === 0) {
    return <p className={styles.prazno}>Nema narudžbi.</p>;
  }

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => {
              const aktivan = col.key === sortKey;
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={col.numeric ? styles.numCol : undefined}
                  aria-sort={
                    aktivan ? (sortDir === "asc" ? "ascending" : "descending") : "none"
                  }
                >
                  <button type="button" className={styles.thButton} onClick={() => onSort(col)}>
                    {col.label}
                    <span className={styles.indikator} aria-hidden="true">
                      {aktivan ? (sortDir === "asc" ? "↑" : "↓") : ""}
                    </span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((o) => (
            <tr key={o.id}>
              <td className={`${styles.datum} num`}>{formatDatum(o.datum)}</td>
              <td>{o.klijent_naziv}</td>
              <td className={`${styles.numCol} num`}>{o.stavke}</td>
              <td className={`${styles.numCol} ${styles.iznos} num`}>{eur.format(o.iznos)}</td>
              <td>
                <Badge tone="neutral">{o.kanal}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
