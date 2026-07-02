import type { Metadata } from "next";

import PageHeading from "@/components/molecules/PageHeading/PageHeading";
import { getBaza } from "@/lib/data";

import styles from "../subpage.module.scss";

export const metadata: Metadata = {
  title: "Narudžbe — Platinum vina",
};

export default async function NarudzbePage() {
  const { Narudzbe } = await getBaza();

  return (
    <>
      <PageHeading title="Narudžbe" subtitle="Pregled narudžbi" />
      <p className={styles.count}>
        <span className="num">{Narudzbe.length}</span> narudžbi
      </p>
      <p className={styles.note}>Tablica dolazi uskoro.</p>
    </>
  );
}
