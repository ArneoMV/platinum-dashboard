import Link from "next/link";

import Container from "@/components/atoms/Container/Container";

import Nav from "./Nav";
import styles from "./layout.module.scss";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <header className={styles.header}>
        <Container className={styles.inner}>
          <Link href="/" className={styles.brand}>
            <span className={styles.mark} aria-hidden="true">
              ▲
            </span>
            <span className={styles.brandName}>Platinum vina</span>
          </Link>

          <div className={styles.right}>
            <Nav />
            <span className={styles.company}>Platinum d.o.o.</span>
          </div>
        </Container>
      </header>

      <main className={styles.main}>
        <Container>{children}</Container>
      </main>
    </>
  );
}
