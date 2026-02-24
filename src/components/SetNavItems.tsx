"use client";

import { useEffect } from "react";

import type { NavItem } from "./NavContext";
import { useNavRegister } from "./NavContext";

export default function SetNavItems({ depth, items }: { depth: number; items: NavItem[] }) {
  const { register, unregister } = useNavRegister();

  useEffect(() => {
    register(depth, items);
    return () => unregister(depth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depth, JSON.stringify(items), register, unregister]);

  return null;
}
