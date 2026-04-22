import { Image } from "@heroui/image";

type Props = {
  team: {
    name: string;
    logoUrl: string | null;
  };
} & React.ComponentProps<typeof Image>;

export default function TeamLogo({ team, ...props }: Props) {
  if (!team.logoUrl) {
    return null;
  }
  return <Image src={team.logoUrl} alt={team.name + " logo"} isBlurred {...props} />;
}
