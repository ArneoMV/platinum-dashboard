import styles from "./SyncBar.module.scss";

export default function SyncBar() {
  return (
    <div className={styles.syncBar}>
      <span className={styles.dot} aria-hidden="true" />
      <span className={styles.text}>
        Sinkronizirano s tablicom · ažurirano uvijek pri učitavanju
      </span>
    </div>
  );
}
