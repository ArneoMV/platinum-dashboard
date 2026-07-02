"use client";

import { Fragment, useMemo, useRef, useState } from "react";

import MaskIcon from "@/components/atoms/MaskIcon/MaskIcon";

import styles from "./DataTable.module.scss";

export type Column<T> = {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
};

type SortState = { key: string; dir: "asc" | "desc" } | null;

type DataTableProps<T> = {
  rows: T[];
  columns: Column<T>[];
  getRowKey: (row: T) => string;
  renderExpanded?: (row: T) => React.ReactNode;
  initialSort?: { key: string; dir: "asc" | "desc" };
  pageSize?: number;
};

function sameSort(a: SortState, b: SortState): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.key === b.key && a.dir === b.dir;
}

function pageList(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "ellipsis", total];
  if (current >= total - 3) {
    return [1, "ellipsis", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
}

export default function DataTable<T>({
  rows,
  columns,
  getRowKey,
  renderExpanded,
  initialSort,
  pageSize = 10,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>(initialSort ?? null);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const wrapRef = useRef<HTMLDivElement>(null);

  const expandable = Boolean(renderExpanded);
  const colCount = columns.length + (expandable ? 1 : 0);
  const initial: SortState = initialSort ?? null;
  const sortChanged = !sameSort(sort, initial);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const valueOf = (row: T): string | number =>
      col.sortValue
        ? col.sortValue(row)
        : ((row as Record<string, unknown>)[col.key] as string | number);

    const indexed = rows.map((row, i) => ({ row, i }));
    indexed.sort((a, b) => {
      const va = valueOf(a.row);
      const vb = valueOf(b.row);
      let cmp: number;
      if (typeof va === "number" && typeof vb === "number") {
        cmp = va - vb;
      } else {
        cmp = String(va).localeCompare(String(vb), "hr", {
          numeric: true,
          sensitivity: "base",
        });
      }
      if (cmp === 0) cmp = a.i - b.i; // stable
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return indexed.map((x) => x.row);
  }, [rows, columns, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  function goToPage(p: number) {
    setPage(Math.min(Math.max(1, p), totalPages));
    setExpanded(new Set()); // collapse on page change
    wrapRef.current?.scrollIntoView({ block: "start" });
  }

  function onSort(col: Column<T>) {
    if (!col.sortable) return;
    setSort((prev) => {
      if (!prev || prev.key !== col.key) return { key: col.key, dir: "asc" };
      if (prev.dir === "asc") return { key: col.key, dir: "desc" };
      return null; // third click → off (original order)
    });
    setPage(1);
  }

  function resetSort() {
    setSort(initial);
    setPage(1);
  }

  function toggleExpand(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className={styles.root}>
      {sortChanged && (
        <div className={styles.toolbar}>
          <button type="button" className={styles.clearSort} onClick={resetSort}>
            Poništi sortiranje
          </button>
        </div>
      )}

      <div className={styles.wrap} ref={wrapRef}>
        <div className={styles.scrollX}>
        <table className={styles.table}>
          <thead>
            <tr>
              {expandable && <th className={styles.chevronCol} aria-hidden="true" />}
              {columns.map((col) => {
                const dir =
                  sort && sort.key === col.key ? sort.dir : null;
                const ariaSort =
                  dir === "asc"
                    ? "ascending"
                    : dir === "desc"
                      ? "descending"
                      : col.sortable
                        ? "none"
                        : undefined;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={ariaSort}
                    className={[
                      styles.th,
                      col.align === "right" && styles.right,
                      col.align === "center" && styles.center,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        className={
                          dir
                            ? `${styles.thButton} ${styles.thActive}`
                            : styles.thButton
                        }
                        onClick={() => onSort(col)}
                      >
                        <span>{col.header}</span>
                        {dir ? (
                          <span
                            className={`${styles.sortTri} ${dir === "asc" ? styles.sortAsc : styles.sortDesc}`}
                            aria-hidden="true"
                          />
                        ) : (
                          <MaskIcon name="sort" className={styles.sortIdle} size={16} />
                        )}
                      </button>
                    ) : (
                      <span className={styles.thStatic}>{col.header}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td className={styles.empty} colSpan={colCount}>
                  Nema podataka.
                </td>
              </tr>
            ) : (
              pageRows.map((row) => {
                const key = getRowKey(row);
                const isOpen = expanded.has(key);
                return (
                  <Fragment key={key}>
                    <tr className={isOpen ? `${styles.row} ${styles.rowOpen}` : styles.row}>
                      {expandable && (
                        <td className={styles.chevronCell}>
                          <button
                            type="button"
                            className={
                              isOpen
                                ? `${styles.chevronBtn} ${styles.chevronOpen}`
                                : styles.chevronBtn
                            }
                            onClick={() => toggleExpand(key)}
                            aria-expanded={isOpen}
                            aria-label={isOpen ? "Sakrij detalje" : "Prikaži detalje"}
                          >
                            <MaskIcon name={isOpen ? "Collapse" : "Expand"} size={20} />
                          </button>
                        </td>
                      )}
                      {columns.map((col) => {
                        const cls = [
                          styles.cell,
                          col.align === "right" && `${styles.right} num`,
                          col.align === "center" && styles.center,
                        ]
                          .filter(Boolean)
                          .join(" ");
                        return (
                          <td key={col.key} className={cls}>
                            {col.render
                              ? col.render(row)
                              : String(
                                  (row as Record<string, unknown>)[col.key] ?? "",
                                )}
                          </td>
                        );
                      })}
                    </tr>
                    {isOpen && renderExpanded && (
                      <tr className={styles.expandRow}>
                        <td className={styles.expandCell} colSpan={colCount}>
                          <div className={styles.expandPanel}>
                            {renderExpanded(row)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > pageSize && (
        <nav className={styles.pager} aria-label="Stranice">
          <button
            type="button"
            className={styles.pagerBtn}
            onClick={() => goToPage(1)}
            disabled={current === 1}
            aria-label="Prva stranica"
          >
            <MaskIcon name="first_page" size={20} />
          </button>
          <button
            type="button"
            className={styles.pagerBtn}
            onClick={() => goToPage(current - 1)}
            disabled={current === 1}
            aria-label="Prethodna stranica"
          >
            <MaskIcon name="arrow_left_alt" size={20} />
          </button>

          {pageList(current, totalPages).map((p, i) =>
            p === "ellipsis" ? (
              <span key={`gap-${i}`} className={styles.ellipsis} aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className={
                  p === current ? `${styles.pageNum} ${styles.pageActive}` : styles.pageNum
                }
                onClick={() => goToPage(p)}
                aria-current={p === current ? "page" : undefined}
              >
                {p}
              </button>
            ),
          )}

          <button
            type="button"
            className={styles.pagerBtn}
            onClick={() => goToPage(current + 1)}
            disabled={current === totalPages}
            aria-label="Sljedeća stranica"
          >
            <MaskIcon name="arrow_right_alt" size={20} />
          </button>
          <button
            type="button"
            className={styles.pagerBtn}
            onClick={() => goToPage(totalPages)}
            disabled={current === totalPages}
            aria-label="Zadnja stranica"
          >
            <MaskIcon name="last_page" size={20} />
          </button>
        </nav>
      )}
      </div>
    </div>
  );
}
