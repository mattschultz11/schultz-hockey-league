import { randEmail, randFirstName, randLastName, randPhoneNumber, randUuid } from "@ngneat/falso";

import { NotFoundError, ValidationError } from "@/service/errors";
import { acceptRegistrations, registerForSeason } from "@/service/models/registrationService";
import prisma from "@/service/prisma";
import type { ServerContext } from "@/types";

import type { SeasonModel } from "../../modelFactory";
import { insertRegistration, insertSeason, insertUser } from "../../modelFactory";
import { createCtx } from "../../utils";

describe("registrationService", () => {
  let ctx: ServerContext;
  let season: SeasonModel;

  beforeAll(() => {
    ctx = createCtx();
  });

  beforeEach(async () => {
    season = await insertSeason();
  });

  it("creates a new registration", async () => {
    const email = randEmail();
    const firstName = randFirstName();
    const lastName = randLastName();

    const result = await registerForSeason(
      {
        seasonId: season.id,
        email,
        firstName,
        lastName,
        position: "F",
        playerRating: 3,
        goalieRating: 1,
      },
      ctx,
    );

    expect(result.email).toBe(email);
    expect(result.firstName).toBe(firstName);
    expect(result.lastName).toBe(lastName);
    expect(result.seasonId).toBe(season.id);
    expect(result.position).toBe("F");
    expect(result.playerRating).toBe(3);
    expect(result.goalieRating).toBe(1);
  });

  it("upserts registration for same email + season", async () => {
    const email = randEmail();

    const first = await registerForSeason(
      {
        seasonId: season.id,
        email,
        firstName: "First",
        position: "D",
      },
      ctx,
    );

    const second = await registerForSeason(
      {
        seasonId: season.id,
        email,
        firstName: "Updated",
        position: "G",
      },
      ctx,
    );

    expect(second.id).toBe(first.id);
    expect(second.firstName).toBe("Updated");
    expect(second.position).toBe("G");
  });

  it("creates separate registrations for same email in different seasons", async () => {
    const email = randEmail();
    const otherSeason = await insertSeason();

    const first = await registerForSeason({ seasonId: season.id, email, firstName: "A" }, ctx);

    const second = await registerForSeason(
      { seasonId: otherSeason.id, email, firstName: "B" },
      ctx,
    );

    expect(first.id).not.toBe(second.id);
    expect(first.seasonId).toBe(season.id);
    expect(second.seasonId).toBe(otherSeason.id);
  });

  it("throws NotFoundError for invalid seasonId", async () => {
    await expect(
      registerForSeason(
        {
          seasonId: randUuid(),
          email: randEmail(),
        },
        ctx,
      ),
    ).rejects.toThrow(NotFoundError);
  });

  it("throws ValidationError when email is missing", async () => {
    await expect(
      registerForSeason(
        {
          seasonId: season.id,
        },
        ctx,
      ),
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError for invalid seasonId format", async () => {
    await expect(
      registerForSeason(
        {
          seasonId: "not-a-uuid",
          email: randEmail(),
        },
        ctx,
      ),
    ).rejects.toThrow(ValidationError);
  });

  it("stores optional fields correctly", async () => {
    const phone = randPhoneNumber();

    const result = await registerForSeason(
      {
        seasonId: season.id,
        email: randEmail(),
        firstName: randFirstName(),
        lastName: randLastName(),
        phone,
        birthday: new Date("1990-05-15"),
        handedness: "LEFT",
        gloveHand: "RIGHT",
        position: "G",
        playerRating: 2,
        goalieRating: 4,
      },
      ctx,
    );

    expect(result.phone).toBe(phone);
    expect(result.handedness).toBe("LEFT");
    expect(result.gloveHand).toBe("RIGHT");
    expect(result.position).toBe("G");
    expect(result.playerRating).toBe(2);
    expect(result.goalieRating).toBe(4);
  });

  describe("acceptRegistrations", () => {
    it("creates User and Player from registration", async () => {
      const reg = await insertRegistration({
        seasonId: season.id,
        firstName: "John",
        lastName: "Doe",
        position: "F",
        playerRating: 3,
      });

      const players = await acceptRegistrations(season.id, [reg.id], ctx);

      expect(players).toHaveLength(1);
      expect(players[0].seasonId).toBe(season.id);
      expect(players[0].position).toBe("F");
      expect(players[0].playerRating).toBe(3);

      // Verify User was created
      const user = await prisma.user.findUnique({ where: { email: reg.email } });
      expect(user).not.toBeNull();
      expect(user!.firstName).toBe("John");
      expect(user!.lastName).toBe("Doe");
      expect(user!.role).toBe("PLAYER");
    });

    it("updates existing User for returning player", async () => {
      const email = randEmail();
      const existingUser = await insertUser({
        email,
        firstName: "Old",
        lastName: "Name",
        role: "MANAGER",
      });

      const reg = await insertRegistration({
        seasonId: season.id,
        email,
        firstName: "New",
        lastName: "Name",
        position: "D",
      });

      const players = await acceptRegistrations(season.id, [reg.id], ctx);

      expect(players).toHaveLength(1);

      // User profile updated but role preserved
      const user = await prisma.user.findUnique({ where: { id: existingUser.id } });
      expect(user!.firstName).toBe("New");
      expect(user!.role).toBe("MANAGER");
    });

    it("is idempotent — updates existing Player if already accepted", async () => {
      const reg = await insertRegistration({
        seasonId: season.id,
        position: "D",
        playerRating: 2,
      });

      const firstResult = await acceptRegistrations(season.id, [reg.id], ctx);
      const playerId = firstResult[0].id;

      // Accept again with same registration (position may have been updated on reg)
      const secondResult = await acceptRegistrations(season.id, [reg.id], ctx);

      expect(secondResult).toHaveLength(1);
      expect(secondResult[0].id).toBe(playerId);
    });

    it("handles multiple registrations in one call", async () => {
      const reg1 = await insertRegistration({ seasonId: season.id });
      const reg2 = await insertRegistration({ seasonId: season.id });
      const reg3 = await insertRegistration({ seasonId: season.id });

      const players = await acceptRegistrations(season.id, [reg1.id, reg2.id, reg3.id], ctx);

      expect(players).toHaveLength(3);
    });

    it("rejects registrations not belonging to the season", async () => {
      const otherSeason = await insertSeason();
      const reg = await insertRegistration({ seasonId: otherSeason.id });

      await expect(acceptRegistrations(season.id, [reg.id], ctx)).rejects.toThrow(ValidationError);
    });

    it("rejects empty registrationIds array", async () => {
      await expect(acceptRegistrations(season.id, [], ctx)).rejects.toThrow(ValidationError);
    });

    it("rejects invalid season ID", async () => {
      await expect(acceptRegistrations(randUuid(), [randUuid()], ctx)).rejects.toThrow(
        NotFoundError,
      );
    });

    it("throws NotFoundError when registration IDs do not exist", async () => {
      await expect(acceptRegistrations(season.id, [randUuid()], ctx)).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
