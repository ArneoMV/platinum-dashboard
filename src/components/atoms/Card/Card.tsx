import styles from "./Card.module.scss";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  eyebrow?: string;
};

export default function Card({ children, className, title, eyebrow }: CardProps) {
  return (
    <div className={[styles.card, className].filter(Boolean).join(" ")}>
      {(title || eyebrow) && (
        <div className={styles.head}>
          {title ? <h3 className={styles.title}>{title}</h3> : null}
          {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
        </div>
      )}
      <div className={styles.body}>{children}</div>
    </div>
  );
}
