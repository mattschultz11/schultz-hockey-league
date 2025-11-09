"use client";
import { Image } from "@heroui/image";
import { Link } from "@heroui/link";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@heroui/navbar";
import { usePathname } from "next/navigation";

const menuItems = ["Teams", "Players", "Games", "Draft", "Seasons"].map((item) => ({
  label: item,
  href: `/${item.toLowerCase()}`,
}));

export default function Nav() {
  const pathname = usePathname();

  return (
    <Navbar maxWidth="xl">
      <NavbarContent>
        <Link href="/">
          <NavbarBrand>
            <Image src="/shl-logo.svg" alt="Schultz Hockey League" width={48} height={48} />
          </NavbarBrand>
        </Link>
      </NavbarContent>

      <NavbarContent className="hidden gap-4 sm:flex" justify="end">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <NavbarItem key={item.label} isActive={isActive}>
              <Link
                color={isActive ? "danger" : "foreground"}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            </NavbarItem>
          );
        })}
      </NavbarContent>

      <NavbarContent className="sm:hidden" justify="end">
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        {menuItems.map((item) => (
          <NavbarMenuItem key={item.label}>
            <Link className="w-full" href={item.href} size="lg">
              {item.label}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  );
}
