function formatPhoneNumber(phone: string) {
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
}

function formatPosition(position: string) {
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
  }
}

function formatEnum(value: string) {
  if (!value) return "";
  if (value === "") return "";
  const withSpaces = value.replace(/_/g, " ").toLowerCase();
  return withSpaces.replace(/\b\w/g, (char) => char.toUpperCase());
}

// Always show 1 decimal place
function formatRating(rating: number) {
  if (!rating) return "-";
  return rating.toFixed(1);
}

export { formatEnum, formatPhoneNumber, formatPosition, formatRating };
