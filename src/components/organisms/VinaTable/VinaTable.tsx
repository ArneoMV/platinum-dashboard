"use client";

import DetailGrid, {
  type DetailItem,
} from "@/components/molecules/DetailGrid/DetailGrid";
import DataTable, {
  type Column,
} from "@/components/organisms/DataTable/DataTable";
import type { Vino } from "@/lib/types";

const eur2 = new Intl.NumberFormat("hr-HR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const cijena = (n: number): string => eur2.format(n);

// Locale-consistent with the "3,05 €" prices in the same panel.
const postotak = (n: number): string =>
  `${n.toLocaleString("hr-HR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

const cijeliBroj = (n: number): string => n.toLocaleString("hr-HR");

const columns: Column<Vino>[] = [
  { key: "id", header: "ID", sortable: true },
  { key: "naziv", header: "Naziv", sortable: true },
  { key: "kategorija", header: "Kategorija", sortable: true },
  { key: "sorta", header: "Sorta", sortable: true },
  { key: "porijeklo", header: "Porijeklo", sortable: true },
  { key: "pakiranje", header: "Pakiranje" },
  {
    key: "prodajna_cijena",
    header: "Prodajna cijena",
    align: "right",
    sortable: true,
    sortValue: (r) => r.prodajna_cijena,
    render: (r) => cijena(r.prodajna_cijena),
  },
];

type VinaTableProps = {
  rows: Vino[];
};

export default function VinaTable({ rows }: VinaTableProps) {
  return (
    <DataTable<Vino>
      rows={rows}
      columns={columns}
      getRowKey={(r) => r.id}
      initialSort={{ key: "naziv", dir: "asc" }}
      pageSize={10}
      renderExpanded={(r) => {
        const items: DetailItem[] = [
          { label: "Alkohol", value: <span className="num">{postotak(r.alkohol)}</span> },
          {
            label: "Nabavna cijena",
            value: <span className="num">{cijena(r.nabavna_cijena)}</span>,
          },
          { label: "Zaliha", value: <span className="num">{cijeliBroj(r.zaliha)}</span> },
          { label: "Bilješka", value: r.biljeska || "—", wide: true },
        ];
        return <DetailGrid items={items} />;
      }}
    />
  );
}
