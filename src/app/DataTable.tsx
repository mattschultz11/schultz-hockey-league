"use client";

import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import type { ReactNode } from "react";

type Column = {
  key: string;
  label: string;
};

type Row = Record<string, ReactNode> & { key: string };

type Props = {
  label: string;
  columns: Column[];
  rows: Row[];
  emptyMessage?: string;
};

export default function DataTable({ label, columns, rows, emptyMessage }: Props) {
  if (rows.length === 0) {
    return (
      <p className="text-default-600 py-8 text-center">{emptyMessage ?? "No data available"}</p>
    );
  }

  return (
    <Table aria-label={label}>
      <TableHeader>
        {columns.map((col) => (
          <TableColumn key={col.key}>{col.label}</TableColumn>
        ))}
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            {columns.map((col) => (
              <TableCell key={col.key}>{row[col.key]}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
