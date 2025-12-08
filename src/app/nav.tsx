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
import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
} from "@heroui/react";
import { Option } from "effect";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";

const menuItems = ["Teams", "Players", "Games", "Draft", "Seasons"].map((item) => ({
  label: item,
  href: `/${item.toLowerCase()}`,
}));

type NavProps = {
  session: Session | null;
};

export default function Nav(props: NavProps) {
  const { session } = props;
  const pathname = usePathname();

  return (
    <Navbar maxWidth="xl" isBordered>
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
                color={isActive ? "primary" : "foreground"}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            </NavbarItem>
          );
        })}
        <NavAuthButton session={Option.fromNullable(session)} />
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

type NavAuthButtonProps = {
  session: Option.Option<Session>;
};

function NavAuthButton(props: NavAuthButtonProps) {
  const { session } = props;

  return (
    <div className="ml-4">
      {session.pipe(
        Option.map((session) => (
          <Dropdown key={session.user.id}>
            <DropdownTrigger>
              <Avatar name={session.user.name ?? ""} />
            </DropdownTrigger>
            <DropdownMenu aria-label="User Actions" disabledKeys={["profile"]}>
              <DropdownSection showDivider>
                <DropdownItem key="profile">
                  <div className="flex flex-col">
                    <p className="text-sm">{session.user.name}</p>
                    <p className="text-sm">{session.user.role}</p>
                  </div>
                </DropdownItem>
              </DropdownSection>

              <DropdownItem
                key="logout"
                className="text-danger"
                color="danger"
                onPress={() => signOut()}
              >
                Sign Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )),
        Option.getOrElse(() => (
          <Button size="sm" color="primary" onPress={() => signIn("google")}>
            Sign In
          </Button>
        )),
      )}
    </div>
  );
}
