"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./Nav.module.scss";

const LINKS = [
  { href: "/klijenti", label: "Klijenti" },
  { href: "/vina", label: "Vina" },
  { href: "/narudzbe", label: "Narudžbe" },
] as const;

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      {LINKS.map((l) => {
        const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={active ? `${styles.link} ${styles.active}` : styles.link}
            aria-current={active ? "page" : undefined}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
