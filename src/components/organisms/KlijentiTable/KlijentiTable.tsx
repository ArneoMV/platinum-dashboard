"use client";

import Badge from "@/components/atoms/Badge/Badge";
import DetailGrid, {
  type DetailItem,
} from "@/components/molecules/DetailGrid/DetailGrid";
import DataTable, {
  type Column,
} from "@/components/organisms/DataTable/DataTable";
import type { Klijent } from "@/lib/types";

// Local-time DD.MM.YYYY. — consistent with the rest of the dashboard.
function formatDatum(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}.`;
}

function statusBadge(status: string) {
  const s = status.trim().toLowerCase();
  if (s === "aktivan") return <Badge tone="positive">Aktivan</Badge>;
  if (s === "za_kontakt") return <Badge tone="attention">Za kontakt</Badge>;
  return <Badge tone="neutral">{status || "—"}</Badge>;
}

const columns: Column<Klijent>[] = [
  { key: "id", header: "ID", sortable: true },
  { key: "naziv", header: "Naziv", sortable: true },
  { key: "grad", header: "Grad", sortable: true },
  { key: "regija", header: "Regija", sortable: true },
  { key: "kontakt_osoba", header: "Kontakt osoba", sortable: true },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (r) => statusBadge(r.status),
  },
];

type KlijentiTableProps = {
  rows: Klijent[];
};

export default function KlijentiTable({ rows }: KlijentiTableProps) {
  return (
    <DataTable<Klijent>
      rows={rows}
      columns={columns}
      getRowKey={(r) => r.id}
      initialSort={{ key: "naziv", dir: "asc" }}
      pageSize={10}
      renderExpanded={(r) => {
        const items: DetailItem[] = [
          { label: "Email", value: r.email || "—" },
          { label: "Uobičajena narudžba", value: r.uobicajena_narudzba || "—" },
          { label: "Zadnji kontakt", value: formatDatum(r.zadnji_kontakt) },
          { label: "Bilješka", value: r.biljeska || "—", wide: true },
        ];
        return <DetailGrid items={items} />;
      }}
    />
  );
}
