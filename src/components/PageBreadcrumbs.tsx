"use client";

import { BreadcrumbItem, Breadcrumbs } from "@heroui/react";

type Item = {
  label: string;
  href?: string;
};

type Props = {
  items: Item[];
};

export default function PageBreadcrumbs({ items }: Props) {
  return (
    <Breadcrumbs
      size="lg"
      itemClasses={{
        item: "text-foreground/90 data-[current=true]:text-foreground data-[current=true]:font-semibold",
        separator: "text-foreground/60",
      }}
    >
      {items.map((item) => (
        <BreadcrumbItem key={item.label} href={item.href}>
          {item.label}
        </BreadcrumbItem>
      ))}
    </Breadcrumbs>
  );
}
