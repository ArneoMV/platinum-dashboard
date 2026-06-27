import DashboardHeader from "@/components/organisms/DashboardHeader/DashboardHeader";
import Container from "@/components/atoms/Container/Container";
import Card from "@/components/atoms/Card/Card";
import styles from "./page.module.scss";

const sections = [
  "Ključni pokazatelji",
  "Za kontakt",
  "Prihod",
  "Katalog",
  "Zadnje narudžbe",
];

export default function Home() {
  return (
    <>
      <DashboardHeader company="Platinum d.o.o." />

      <main className={styles.main}>
        <Container>
          <div className={styles.pageHead}>
            <h1 className={styles.title}>Pregled</h1>
            <p className={styles.subtitle}>Platinum vina · interni pregled</p>
          </div>

          <div className={styles.grid}>
            {sections.map((section) => (
              <Card key={section} title={section}>
                <p className={styles.soon}>uskoro</p>
              </Card>
            ))}
          </div>
        </Container>
      </main>
    </>
  );
}
