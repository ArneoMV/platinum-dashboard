"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import styles from "./SyncBar.module.scss";

// "Is hydrated" detector (server snapshot false, client true) so the relative
// timestamp is computed only on the client — no hydration mismatch.
const emptySubscribe = () => () => {};

function relativno(fromMs: number, nowMs: number): string {
  const s = Math.max(0, Math.round((nowMs - fromMs) / 1000));
  if (s < 5) return "upravo sada";
  if (s < 60) return `prije ${s} s`;
  const m = Math.floor(s / 60);
  return `prije ${m} min`;
}

type SyncBarProps = {
  lastUpdated: number;
  isRefreshing?: boolean;
  pulseKey?: number;
};

export default function SyncBar({
  lastUpdated,
  isRefreshing = false,
  pulseKey = 0,
}: SyncBarProps) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  // `now` is state (ticked by the interval) rather than a Date.now() call in
  // render, so render stays pure. Starts at lastUpdated → "upravo sada".
  const [now, setNow] = useState<number>(lastUpdated);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const label = mounted ? relativno(lastUpdated, now) : "upravo sada";

  return (
    <div
      className={styles.syncBar}
      data-refreshing={isRefreshing ? "true" : undefined}
    >
      {/* key remount replays the CSS pulse on each real data change */}
      <span key={pulseKey} className={styles.dot} aria-hidden="true" />
      <span className={styles.text}>
        Sinkronizirano s tablicom · ažurirano {label}
      </span>
    </div>
  );
}
