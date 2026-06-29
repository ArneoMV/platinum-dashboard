import styles from "./Katalog.module.scss";

type KategorijaMarza = { kategorija: string; marza: number; broj: number };

type KatalogProps = {
  kategorije: KategorijaMarza[];
};

const pct = new Intl.NumberFormat("hr-HR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export default function Katalog({ kategorije }: KatalogProps) {
  if (kategorije.length === 0) {
    return <p className={styles.prazno}>Nema podataka.</p>;
  }

  const sorted = [...kategorije].sort((a, b) => b.marza - a.marza);
  const maxMarza = Math.max(0, ...sorted.map((k) => k.marza));

  return (
    <ul className={styles.lista}>
      {sorted.map((k) => (
        <li key={k.kategorija} className={styles.row}>
          <div className={styles.glava}>
            <span className={styles.naziv}>{k.kategorija}</span>
            <span className={styles.broj}>{k.broj} vina</span>
          </div>
          <span className={`${styles.pct} num`}>{pct.format(k.marza)}</span>
          <span className={styles.traka}>
            <span
              className={styles.trakaFill}
              style={{ width: `${maxMarza > 0 ? (k.marza / maxMarza) * 100 : 0}%` }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}
