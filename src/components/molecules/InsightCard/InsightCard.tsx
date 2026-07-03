import Link from "next/link";

import styles from "./InsightCard.module.scss";

type InsightCardProps = {
  label: string;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  href: string;
  linkText: string;
};

// Compact home overview card: eyebrow label, a takeaway line, an optional muted
// detail, and a footer link to the matching sub-page.
export default function InsightCard({
  label,
  primary,
  secondary,
  href,
  linkText,
}: InsightCardProps) {
  return (
    <div className={styles.card}>
      <span className={styles.label}>{label}</span>
      <p className={styles.primary}>{primary}</p>
      {secondary != null && <p className={styles.secondary}>{secondary}</p>}
      <Link className={styles.link} href={href}>
        {linkText}
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
      </Link>
    </div>
  );
}
