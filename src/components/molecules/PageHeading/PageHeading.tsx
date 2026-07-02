import styles from "./PageHeading.module.scss";

type PageHeadingProps = {
  title: string;
  subtitle?: string;
};

// Matches the home "Pregled" heading style (headline-m title + muted subtitle).
export default function PageHeading({ title, subtitle }: PageHeadingProps) {
  return (
    <div className={styles.pageHead}>
      <h1 className={styles.title}>{title}</h1>
      {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
    </div>
  );
}
