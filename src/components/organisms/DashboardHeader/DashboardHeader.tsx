import Container from "@/components/atoms/Container/Container";
import styles from "./DashboardHeader.module.scss";

type DashboardHeaderProps = {
  company?: string;
};

export default function DashboardHeader({
  company = "Platinum d.o.o.",
}: DashboardHeaderProps) {
  const initial = company.trim().charAt(0).toUpperCase() || "P";

  return (
    <header className={styles.header}>
      <Container className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            ▲
          </span>
          <span className={styles.brandName}>Platinum vina</span>
        </div>

        <div className={styles.account}>
          <span className={styles.avatar} aria-hidden="true">
            {initial}
          </span>
          <span className={styles.company}>{company}</span>
        </div>
      </Container>
    </header>
  );
}
