import { NotFoundError } from "@/service/errors";
import type { ServerContext } from "@/types";

import { registrationSchema } from "../validation/schemas";
import { cleanInput, validate } from "./modelServiceUtils";
import { getSeasonById } from "./seasonService";

export async function registerForSeason(data: unknown, ctx: ServerContext) {
  const validated = validate(registrationSchema, data);

  // Verify season exists
  await getSeasonById(validated.seasonId, ctx);

  const fields = cleanInput({
    firstName: validated.firstName,
    lastName: validated.lastName,
    phone: validated.phone,
    birthday: validated.birthday as Date | string | null | undefined,
    handedness: validated.handedness,
    gloveHand: validated.gloveHand,
    position: validated.position,
    playerRating: validated.playerRating,
    goalieRating: validated.goalieRating,
    classification: validated.classification,
    referral: validated.referral,
  });

  return ctx.prisma.registration.upsert({
    where: {
      seasonId_email: {
        seasonId: validated.seasonId,
        email: validated.email,
      },
    },
    create: {
      seasonId: validated.seasonId,
      email: validated.email,
      ...fields,
    },
    update: fields,
  });
}

export async function getRegistrationsBySeason(seasonId: string, ctx: ServerContext) {
  return ctx.prisma.registration.findMany({
    where: { seasonId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getRegistrationById(id: string, ctx: ServerContext) {
  return ctx.prisma.registration.findUnique({ where: { id } });
}

export async function getRegistrationSeason(registrationId: string, ctx: ServerContext) {
  const season = await ctx.prisma.registration
    .findUnique({ where: { id: registrationId } })
    .season();
  if (!season) throw new NotFoundError("Registration", registrationId);
  return season;
}
