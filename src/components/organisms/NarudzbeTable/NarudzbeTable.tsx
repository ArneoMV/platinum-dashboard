"use client";

import Badge from "@/components/atoms/Badge/Badge";
import DetailGrid, {
  type DetailItem,
} from "@/components/molecules/DetailGrid/DetailGrid";
import DataTable, {
  type Column,
} from "@/components/organisms/DataTable/DataTable";
import type { Narudzba } from "@/lib/types";

// Order totals: 0 decimals, matching ZadnjeNarudzbe (e.g. "1.980 €").
const eur0 = new Intl.NumberFormat("hr-HR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Local-time DD.MM.YYYY. — same helper pattern as KlijentiTable / ZadnjeNarudzbe.
function formatDatum(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}.`;
}

const columns: Column<Narudzba>[] = [
  { key: "id", header: "ID", sortable: true },
  {
    key: "datum",
    header: "Datum",
    sortable: true,
    sortValue: (r) => new Date(r.datum).getTime(),
    render: (r) => formatDatum(r.datum),
  },
  { key: "klijent_naziv", header: "Klijent", sortable: true },
  {
    key: "stavke",
    header: "Stavke",
    align: "right",
    sortable: true,
    sortValue: (r) => r.stavke,
    render: (r) => r.stavke.toLocaleString("hr-HR"),
  },
  {
    key: "iznos",
    header: "Iznos",
    align: "right",
    sortable: true,
    sortValue: (r) => r.iznos,
    render: (r) => eur0.format(r.iznos),
  },
  {
    key: "kanal",
    header: "Kanal",
    sortable: true,
    render: (r) => <Badge tone="neutral">{r.kanal || "—"}</Badge>,
  },
];

type NarudzbeTableProps = {
  rows: Narudzba[];
};

export default function NarudzbeTable({ rows }: NarudzbeTableProps) {
  return (
    <DataTable<Narudzba>
      rows={rows}
      columns={columns}
      getRowKey={(r) => r.id}
      initialSort={{ key: "datum", dir: "desc" }}
      pageSize={10}
      renderExpanded={(r) => {
        const items: DetailItem[] = [
          {
            label: "Klijent ID",
            value: r.klijent_id ? (
              <span className="num">{r.klijent_id}</span>
            ) : (
              "nije povezan"
            ),
          },
          { label: "Bilješka", value: r.biljeska || "—", wide: true },
        ];
        return <DetailGrid items={items} />;
      }}
    />
  );
}
