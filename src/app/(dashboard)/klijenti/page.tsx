import type { Metadata } from "next";

import PageHeading from "@/components/molecules/PageHeading/PageHeading";
import KlijentiTable from "@/components/organisms/KlijentiTable/KlijentiTable";
import { getBaza } from "@/lib/data";

export const metadata: Metadata = {
  title: "Klijenti — Platinum vina",
};

export default async function KlijentiPage() {
  const { Klijenti } = await getBaza();

  return (
    <>
      <PageHeading title="Klijenti" subtitle="Pregled klijenata" />
      <KlijentiTable rows={Klijenti} />
    </>
  );
}
