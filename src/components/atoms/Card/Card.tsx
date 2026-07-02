import styles from "./Card.module.scss";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  eyebrow?: string;
  /** When true (default) the card body scrolls at max-height with a sticky
   *  header. Pass false for cards that should size to content (e.g. the KPI
   *  row, or organisms that manage their own internal scroll). */
  scroll?: boolean;
};

export default function Card({
  children,
  className,
  title,
  eyebrow,
  scroll = true,
}: CardProps) {
  return (
    <div className={[styles.card, className].filter(Boolean).join(" ")}>
      <div className={[styles.scroll, scroll ? null : styles.noScroll].filter(Boolean).join(" ")}>
        {(title || eyebrow) && (
          <div className={styles.head}>
            {title ? <h3 className={styles.title}>{title}</h3> : null}
            {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
          </div>
        )}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
