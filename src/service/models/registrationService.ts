import { NotFoundError, ValidationError } from "@/service/errors";
import type { ServerContext } from "@/types";

import { acceptRegistrationsSchema, registrationSchema } from "../validation/schemas";
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

export async function acceptRegistrations(
  seasonId: string,
  registrationIds: string[],
  ctx: ServerContext,
) {
  const validated = validate(acceptRegistrationsSchema, { seasonId, registrationIds });

  // Verify season exists
  await getSeasonById(validated.seasonId, ctx);

  // Fetch all registrations and verify they belong to this season
  const registrations = await ctx.prisma.registration.findMany({
    where: { id: { in: [...validated.registrationIds] } },
  });

  if (registrations.length !== validated.registrationIds.length) {
    const foundIds = new Set(registrations.map((r) => r.id));
    const missing = validated.registrationIds.filter((id) => !foundIds.has(id));
    throw new NotFoundError("Registration", missing.join(", "));
  }

  const wrongSeason = registrations.filter((r) => r.seasonId !== validated.seasonId);
  if (wrongSeason.length > 0) {
    throw new ValidationError(
      `Registrations do not belong to this season: ${wrongSeason.map((r) => r.id).join(", ")}`,
    );
  }

  return ctx.prisma.$transaction(async (tx) => {
    const players = [];

    for (const reg of registrations) {
      // Upsert User by email — create with registration fields, update profile only
      const user = await tx.user.upsert({
        where: { email: reg.email },
        create: {
          email: reg.email,
          firstName: reg.firstName,
          lastName: reg.lastName,
          phone: reg.phone,
          birthday: reg.birthday,
          handedness: reg.handedness,
          gloveHand: reg.gloveHand,
          role: "PLAYER",
        },
        update: {
          firstName: reg.firstName,
          lastName: reg.lastName,
          phone: reg.phone,
          birthday: reg.birthday,
          handedness: reg.handedness,
          gloveHand: reg.gloveHand,
        },
      });

      // Find existing Player for this user+season
      const existingPlayer = await tx.player.findFirst({
        where: { userId: user.id, seasonId: validated.seasonId },
      });

      const playerData = {
        classification: reg.classification,
        position: reg.position,
        playerRating: reg.playerRating,
        goalieRating: reg.goalieRating,
      };

      if (existingPlayer) {
        const updated = await tx.player.update({
          where: { id: existingPlayer.id },
          data: playerData,
        });
        players.push(updated);
      } else {
        const created = await tx.player.create({
          data: {
            userId: user.id,
            seasonId: validated.seasonId,
            ...playerData,
          },
        });
        players.push(created);
      }
    }

    return players;
  });
}
