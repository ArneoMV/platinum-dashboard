import type { Metadata } from "next";

import PageHeading from "@/components/molecules/PageHeading/PageHeading";
import NarudzbeTable from "@/components/organisms/NarudzbeTable/NarudzbeTable";
import { getBaza } from "@/lib/data";

export const metadata: Metadata = {
  title: "Narudžbe — Platinum vina",
};

export default async function NarudzbePage() {
  const { Narudzbe } = await getBaza();

  return (
    <>
      <PageHeading title="Narudžbe" subtitle="Pregled narudžbi" />
      <NarudzbeTable rows={Narudzbe} />
    </>
  );
}
