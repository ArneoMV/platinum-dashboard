import styles from "./DetailGrid.module.scss";

export type DetailItem = {
  label: string;
  value: React.ReactNode;
  /** Span the full width (e.g. the biljeska notes field). */
  wide?: boolean;
};

type DetailGridProps = {
  items: DetailItem[];
};

// Reusable label/value grid for table expanded panels (Klijenti/Vina/Narudzbe).
export default function DetailGrid({ items }: DetailGridProps) {
  return (
    <dl className={styles.grid}>
      {items.map((item) => (
        <div
          key={item.label}
          className={item.wide ? `${styles.item} ${styles.wide}` : styles.item}
        >
          <dt className={styles.label}>{item.label}</dt>
          <dd className={styles.value}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
