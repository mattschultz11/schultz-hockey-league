"use client";

import type { PropsWithChildren } from "react";

export default function PageLayout(props: PropsWithChildren) {
  return <div className="flex flex-col gap-6">{props.children}</div>;
}
