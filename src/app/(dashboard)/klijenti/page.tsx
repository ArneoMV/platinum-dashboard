import type { Metadata } from "next";

import PageHeading from "@/components/molecules/PageHeading/PageHeading";
import { getBaza } from "@/lib/data";

import styles from "../subpage.module.scss";

export const metadata: Metadata = {
  title: "Klijenti — Platinum vina",
};

export default async function KlijentiPage() {
  const { Klijenti } = await getBaza();

  return (
    <>
      <PageHeading title="Klijenti" subtitle="Pregled klijenata" />
      <p className={styles.count}>
        <span className="num">{Klijenti.length}</span> klijenata
      </p>
      <p className={styles.note}>Tablica dolazi uskoro.</p>
    </>
  );
}
