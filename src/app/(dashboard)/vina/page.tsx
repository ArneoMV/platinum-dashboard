import type { Metadata } from "next";

import PageHeading from "@/components/molecules/PageHeading/PageHeading";
import VinaTable from "@/components/organisms/VinaTable/VinaTable";
import { getBaza } from "@/lib/data";

export const metadata: Metadata = {
  title: "Vina — Platinum vina",
};

export default async function VinaPage() {
  const { Vina } = await getBaza();

  return (
    <>
      <PageHeading title="Vina" subtitle="Pregled vina" />
      <VinaTable rows={Vina} />
    </>
  );
}
