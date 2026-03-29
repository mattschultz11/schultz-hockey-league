import type { PropsWithChildren } from "react";

export default function PageHeader(props: PropsWithChildren) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2">{props.children}</div>
  );
}
