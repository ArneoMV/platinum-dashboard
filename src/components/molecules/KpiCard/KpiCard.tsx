import styles from "./KpiCard.module.scss";

type KpiCardProps = {
  label: string;
  value: string;
  tone?: "default" | "attention";
};

export default function KpiCard({ label, value, tone = "default" }: KpiCardProps) {
  return (
    <div
      className={[styles.kpi, tone === "attention" && styles.attention]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={styles.label}>{label}</span>
      <span className={`${styles.value} num`}>{value}</span>
    </div>
  );
}
