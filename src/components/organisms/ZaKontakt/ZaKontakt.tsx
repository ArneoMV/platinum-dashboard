"use client";

import { useState } from "react";

import Badge from "@/components/atoms/Badge/Badge";
import Button from "@/components/atoms/Button/Button";
import type { Klijent } from "@/lib/types";
import styles from "./ZaKontakt.module.scss";

type KlijentZaKontakt = Klijent & { dani: number };

type ZaKontaktProps = {
  clients: KlijentZaKontakt[];
};

function daniLabel(dani: number): string {
  return Number.isFinite(dani) ? `${dani} dana` : "nikad";
}

export default function ZaKontakt({ clients }: ZaKontaktProps) {
  const [poslano, setPoslano] = useState<Set<string>>(new Set());

  if (clients.length === 0) {
    return <p className={styles.prazno}>Nema klijenata za kontakt — sve čisto.</p>;
  }

  const preostalo = clients.length - poslano.size;

  function oznaciPoslano(id: string) {
    // future: Make webhook — POST the reminder to the messaging backend here.
    setPoslano((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  return (
    <div>
      <p className={styles.brojac}>
        <span className="num">{preostalo}</span> za kontakt
      </p>

      <ul className={styles.lista}>
        {clients.map((c) => {
          const jePoslano = poslano.has(c.id);
          return (
            <li
              key={c.id}
              className={[styles.row, jePoslano && styles.poslano]
                .filter(Boolean)
                .join(" ")}
            >
              <div className={styles.info}>
                <span className={styles.naziv}>{c.naziv}</span>
                <span className={styles.meta}>
                  {c.grad} · obično: {c.uobicajena_narudzba}
                </span>
              </div>

              <div className={styles.akcije}>
                <Badge tone="attention">{daniLabel(c.dani)}</Badge>
                {jePoslano ? (
                  <span className={styles.poslanoOznaka}>✓ Poslano</span>
                ) : (
                  <Button onClick={() => oznaciPoslano(c.id)}>
                    Pošalji podsjetnik
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
