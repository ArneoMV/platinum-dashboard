import styles from "./Card.module.scss";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
};

export default function Card({ children, className, title }: CardProps) {
  return (
    <div className={[styles.card, className].filter(Boolean).join(" ")}>
      {title ? <h3 className={styles.title}>{title}</h3> : null}
      {children}
    </div>
  );
}
