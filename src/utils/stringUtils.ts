import type { Position } from "@/graphql/generated";

function formatDate(date?: Date | string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString();
}

function formatDateTime(dateTime?: Date | null) {
  if (!dateTime) return "-";
  return new Date(dateTime).toLocaleDateString() + " " + new Date(dateTime).toLocaleTimeString();
}

function formatPhoneNumber(phone: string) {
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
}

function formatPosition(position?: Position | null) {
  switch (position) {
    case "F":
      return "F";
    case "F_D":
      return "F/D";
    case "D_F":
      return "D/F";
    case "D":
      return "D";
    case "G":
      return "G";
    default:
      return "-";
  }
}

function formatEnum(value?: string | null) {
  if (!value) return "";
  if (value === "") return "";
  const withSpaces = value.replace(/_/g, " ").toLowerCase();
  return withSpaces.replace(/\b\w/g, (char) => char.toUpperCase());
}

// Always show 1 decimal place
function formatRating(rating?: number | null) {
  if (!rating) return "-";
  return rating.toFixed(1);
}

type Names = {
  firstName: string | null;
  lastName: string | null;
};

function formatName(names: Names) {
  return [names.firstName, names.lastName].filter(Boolean).join(" ") || "-";
}

type PlayerWithName = {
  user: {
    firstName: string | null;
    lastName: string | null;
  };
};

function playerName(player?: PlayerWithName | null) {
  if (!player) return "-";
  if (!player.user) return "-";
  return formatName(player.user);
}

type PlayerWithRating = {
  position?: Position | null;
  playerRating: number | null;
  goalieRating: number | null;
};

function playerRating(player?: PlayerWithRating | null) {
  if (!player) return "-";
  if (!player.playerRating && !player.goalieRating) return "-";
  if (player.position === "G") return formatRating(player.goalieRating);
  return formatRating(player.playerRating);
}

type PlayerWithPosition = {
  position?: Position | null;
};

function playerPosition(player?: PlayerWithPosition | null) {
  return formatPosition(player?.position);
}

type PlayerWithNumber = {
  number: number | null;
};

function playerNumber(player?: PlayerWithNumber | null) {
  return player?.number?.toString() ?? "-";
}

type TeamWithName = {
  name: string;
};

function teamName(team?: TeamWithName | null) {
  if (!team) return "-";
  return team.name;
}

export {
  formatDate,
  formatDateTime,
  formatEnum,
  formatName,
  formatPhoneNumber,
  formatPosition,
  formatRating,
  playerName,
  playerNumber,
  playerPosition,
  playerRating,
  teamName,
};
