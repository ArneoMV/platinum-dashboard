import styles from "./Badge.module.scss";

type BadgeTone = "neutral" | "attention" | "positive";

type BadgeProps = {
  children: React.ReactNode;
  tone?: BadgeTone;
};

export default function Badge({ children, tone = "neutral" }: BadgeProps) {
  return <span className={[styles.badge, styles[tone]].join(" ")}>{children}</span>;
}
