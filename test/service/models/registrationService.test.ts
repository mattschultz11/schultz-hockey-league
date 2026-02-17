import { randEmail, randFirstName, randLastName, randPhoneNumber, randUuid } from "@ngneat/falso";

import { NotFoundError, ValidationError } from "@/service/errors";
import { registerForSeason } from "@/service/models/registrationService";
import type { ServerContext } from "@/types";

import type { SeasonModel } from "../../modelFactory";
import { insertSeason } from "../../modelFactory";
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
});
