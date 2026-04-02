import { NotFoundError, ValidationError } from "@/service/errors";
import { AuditAction } from "@/service/prisma";
import type { ServerContext } from "@/types";

import { logAuditEntry } from "../audit/auditService";
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

  const result = await ctx.prisma.registration.upsert({
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

  logAuditEntry(ctx, {
    action: AuditAction.CREATE,
    entityType: "Registration",
    entityId: result.id,
    metadata: { seasonId: validated.seasonId, email: validated.email },
    endpoint: "Mutation.register",
  });

  return result;
}

export async function getRegistrationsBySeason(seasonId: string, ctx: ServerContext) {
  return ctx.prisma.registration.findMany({
    where: { seasonId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getRegistrationById(id: string, ctx: ServerContext) {
  const registration = await ctx.prisma.registration.findUnique({ where: { id } });
  if (!registration) throw new NotFoundError("Registration", id);
  return registration;
}

export async function getRegistrationsByIds(ids: string[], ctx: ServerContext) {
  const registrations = await ctx.prisma.registration.findMany({ where: { id: { in: ids } } });
  if (registrations.length !== ids.length) {
    throw new NotFoundError(
      "Registration",
      ids.filter((id) => !registrations.some((registration) => registration.id === id)).join(", "),
    );
  }
  return registrations;
}

export async function acceptRegistrations(
  seasonId: string,
  registrationIds: string[],
  ctx: ServerContext,
) {
  validate(acceptRegistrationsSchema, { seasonId, registrationIds });

  // Verify season exists
  await getSeasonById(seasonId, ctx);

  // Fetch all registrations and verify they belong to this season
  const registrations = await getRegistrationsByIds(registrationIds, ctx);

  const wrongSeason = registrations.filter((r) => r.seasonId !== seasonId);
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
        where: { userId: user.id, seasonId },
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
            seasonId,
            ...playerData,
          },
        });
        players.push(created);
      }
    }

    return players;
  });
}

export async function getRegistrationSeason(registrationId: string, ctx: ServerContext) {
  return (await ctx.prisma.registration.findUnique({ where: { id: registrationId } }).season())!;
}
