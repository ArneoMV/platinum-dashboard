import type { Metadata } from "next";

import PageHeading from "@/components/molecules/PageHeading/PageHeading";
import { getBaza } from "@/lib/data";

import styles from "../subpage.module.scss";

export const metadata: Metadata = {
  title: "Vina — Platinum vina",
};

export default async function VinaPage() {
  const { Vina } = await getBaza();

  return (
    <>
      <PageHeading title="Vina" subtitle="Pregled vina" />
      <p className={styles.count}>
        <span className="num">{Vina.length}</span> vina
      </p>
      <p className={styles.note}>Tablica dolazi uskoro.</p>
    </>
  );
}
