import DashboardHeader from "@/components/organisms/DashboardHeader/DashboardHeader";
import Container from "@/components/atoms/Container/Container";
import { getBaza } from "@/lib/data";

import DashboardLive from "./DashboardLive";
import styles from "./page.module.scss";

export default async function Home() {
  // Server-fetched (ISR, 60s) initial data → seeds the client provider so first
  // paint stays server-rendered; DashboardLive then polls /api/baza for updates.
  const initialData = await getBaza();

  return (
    <>
      <DashboardHeader company="Platinum d.o.o." />

      <main className={styles.main}>
        <Container>
          <DashboardLive initialData={initialData} />
        </Container>
      </main>
    </>
  );
}
