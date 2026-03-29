"use client";

import type { TableProps } from "@heroui/react";
import { Table } from "@heroui/react";

export default function DataTable(props: Omit<TableProps, "classNames" | "removeWrapper">) {
  return (
    <div className="overflow-x-auto">
      <Table {...props} removeWrapper classNames={{ th: "bg-primary/50 text-default-800" }} />
    </div>
  );
}
