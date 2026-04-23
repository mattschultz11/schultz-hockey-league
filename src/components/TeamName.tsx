import type { ComponentPropsWithoutRef, CSSProperties, ElementType } from "react";

function neonTextCss(textColor: string | null, outlineColor: string | null, outlineWidth: number) {
  const shadows = [];
  const scales = [1, 2, 3, 4, 6, 8, 10, 15];
  for (const scale of scales) {
    shadows.push(`0px 0px ${scale * outlineWidth}px ${outlineColor}`);
  }

  return {
    color: textColor ?? undefined,
    textShadow: outlineColor ? shadows.join(", ") : undefined,
  } as const;
}

function outlinedTextCss(
  textColor: string | null,
  outlineColor: string | null,
  outlineWidth: number,
) {
  const shadows = [];
  for (let i = -outlineWidth; i <= outlineWidth; i++) {
    for (let j = -outlineWidth; j <= outlineWidth; j++) {
      shadows.push(`${i}px ${j}px 0 ${outlineColor}`);
    }
  }

  return {
    color: textColor ?? undefined,
    textShadow: outlineColor ? shadows.join(", ") : undefined,
  } as const;
}

type TeamNameOwnProps = {
  team: {
    name: string;
    primaryColor: string | null;
    secondaryColor: string | null;
  };
  outlineWidth?: number;
  variant?: "neon" | "outlined" | "chip";
};

type TeamNameProps<E extends ElementType> = TeamNameOwnProps & {
  as?: E;
} & Omit<ComponentPropsWithoutRef<E>, keyof TeamNameOwnProps | "as">;

export default function TeamName<E extends ElementType = "span">({
  as,
  team,
  style,
  children,
  outlineWidth = 1,
  variant = "neon",
  ...props
}: TeamNameProps<E>) {
  const Component = (as ?? "span") as ElementType;
  const teamStyle =
    variant === "neon"
      ? neonTextCss(team.secondaryColor, team.primaryColor, outlineWidth)
      : outlinedTextCss(team.primaryColor, team.secondaryColor, outlineWidth);

  return (
    <Component
      {...props}
      style={{
        whiteSpace: "nowrap",
        textDecoration: "none",
        fontWeight: "bold",
        ...teamStyle,
        ...(style as CSSProperties | undefined),
      }}
    >
      {children ?? team.name}
    </Component>
  );
}

export { neonTextCss, outlinedTextCss };
