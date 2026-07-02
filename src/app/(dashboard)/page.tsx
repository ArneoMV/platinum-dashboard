import { getBaza } from "@/lib/data";

import DashboardLive from "./DashboardLive";

export default async function Home() {
  // Server-fetched (ISR, 60s) initial data → seeds the client provider so first
  // paint stays server-rendered; DashboardLive then polls /api/baza for updates.
  const initialData = await getBaza();

  return <DashboardLive initialData={initialData} />;
}
