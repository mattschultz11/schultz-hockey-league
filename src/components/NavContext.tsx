"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useState } from "react";

export type NavItem = { label: string; href: string };

const DEFAULT_ITEMS: NavItem[] = [{ label: "Leagues", href: "/leagues" }];

type NavContextValue = {
  items: NavItem[];
  register: (depth: number, items: NavItem[]) => void;
  unregister: (depth: number) => void;
};

const NavContext = createContext<NavContextValue | null>(null);

function deriveItems(map: Map<number, NavItem[]>): NavItem[] {
  if (map.size === 0) return DEFAULT_ITEMS;
  const maxDepth = Math.max(...map.keys());
  return map.get(maxDepth) ?? DEFAULT_ITEMS;
}

export function NavProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NavItem[]>(DEFAULT_ITEMS);
  const [map] = useState(() => new Map<number, NavItem[]>());

  const register = useCallback(
    (depth: number, navItems: NavItem[]) => {
      map.set(depth, navItems);
      setItems(deriveItems(map));
    },
    [map],
  );

  const unregister = useCallback(
    (depth: number) => {
      map.delete(depth);
      setItems(deriveItems(map));
    },
    [map],
  );

  return <NavContext value={{ items, register, unregister }}>{children}</NavContext>;
}

export function useNavItems(): NavItem[] {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNavItems must be used within NavProvider");
  return ctx.items;
}

export function useNavRegister() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNavRegister must be used within NavProvider");
  return { register: ctx.register, unregister: ctx.unregister };
}
