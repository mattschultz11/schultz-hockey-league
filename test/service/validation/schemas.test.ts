import { randUuid } from "@ngneat/falso";

import { ValidationError } from "@/service/errors";
import { validate } from "@/service/models/modelServiceUtils";
import {
  draftPickCreateSchema,
  draftPickUpdateSchema,
  gameCreateSchema,
  goalCreateSchema,
  goalUpdateSchema,
  leagueCreateSchema,
  penaltyCreateSchema,
  penaltyUpdateSchema,
  playerCreateSchema,
  playerUpdateSchema,
  seasonCreateSchema,
  teamCreateSchema,
  userCreateSchema,
} from "@/service/validation/schemas";

const uuid = () => randUuid();

describe("validation schemas", () => {
  describe("userCreateSchema", () => {
    it("accepts valid input", () => {
      expect(() => validate(userCreateSchema, { email: "test@example.com" })).not.toThrow();
    });

    it("rejects empty email", () => {
      expect(() => validate(userCreateSchema, { email: "" })).toThrow(ValidationError);
    });

    it("rejects invalid email format", () => {
      expect(() => validate(userCreateSchema, { email: "not-an-email" })).toThrow(ValidationError);
    });

    it("trims whitespace from names", () => {
      const result = validate(userCreateSchema, {
        email: "a@b.com",
        firstName: "  John  ",
        lastName: "  Doe  ",
      });
      expect(result.firstName).toBe("John");
      expect(result.lastName).toBe("Doe");
    });

    it("rejects invalid role", () => {
      expect(() => validate(userCreateSchema, { email: "a@b.com", role: "SUPERADMIN" })).toThrow(
        ValidationError,
      );
    });

    it("accepts valid handedness and gloveHand", () => {
      expect(() =>
        validate(userCreateSchema, {
          email: "a@b.com",
          handedness: "LEFT",
          gloveHand: "RIGHT",
        }),
      ).not.toThrow();
    });
  });

  describe("leagueCreateSchema", () => {
    it("accepts valid input", () => {
      expect(() => validate(leagueCreateSchema, { name: "NHL" })).not.toThrow();
    });

    it("rejects empty name", () => {
      expect(() => validate(leagueCreateSchema, { name: "" })).toThrow(ValidationError);
    });

    it("rejects whitespace-only name", () => {
      expect(() => validate(leagueCreateSchema, { name: "   " })).toThrow(ValidationError);
    });

    it("trims name", () => {
      const result = validate(leagueCreateSchema, { name: "  NHL  " });
      expect(result.name).toBe("NHL");
    });
  });

  describe("playerCreateSchema", () => {
    const validPlayer = {
      userId: uuid(),
      seasonId: uuid(),
    };

    it("accepts valid input with ratings and jersey", () => {
      expect(() =>
        validate(playerCreateSchema, {
          ...validPlayer,
          number: 99,
          playerRating: 5,
          goalieRating: 1,
          lockerRating: 3,
          position: "G",
        }),
      ).not.toThrow();
    });

    it("rejects jersey number 0", () => {
      expect(() => validate(playerCreateSchema, { ...validPlayer, number: 0 })).toThrow(
        ValidationError,
      );
    });

    it("rejects jersey number 100", () => {
      expect(() => validate(playerCreateSchema, { ...validPlayer, number: 100 })).toThrow(
        ValidationError,
      );
    });

    it("accepts jersey number 1", () => {
      expect(() => validate(playerCreateSchema, { ...validPlayer, number: 1 })).not.toThrow();
    });

    it("accepts jersey number 99", () => {
      expect(() => validate(playerCreateSchema, { ...validPlayer, number: 99 })).not.toThrow();
    });

    it("rejects rating 0", () => {
      expect(() => validate(playerCreateSchema, { ...validPlayer, playerRating: 0 })).toThrow(
        ValidationError,
      );
    });

    it("rejects rating 6", () => {
      expect(() => validate(playerCreateSchema, { ...validPlayer, playerRating: 6 })).toThrow(
        ValidationError,
      );
    });

    it("accepts rating 1", () => {
      expect(() => validate(playerCreateSchema, { ...validPlayer, playerRating: 1 })).not.toThrow();
    });

    it("accepts rating 5", () => {
      expect(() => validate(playerCreateSchema, { ...validPlayer, playerRating: 5 })).not.toThrow();
    });

    it("rejects invalid position", () => {
      expect(() => validate(playerCreateSchema, { ...validPlayer, position: "CENTER" })).toThrow(
        ValidationError,
      );
    });

    it("rejects invalid UUID for userId", () => {
      expect(() => validate(playerCreateSchema, { ...validPlayer, userId: "not-a-uuid" })).toThrow(
        ValidationError,
      );
    });
  });

  describe("playerUpdateSchema", () => {
    it("accepts empty update (all optional)", () => {
      expect(() => validate(playerUpdateSchema, {})).not.toThrow();
    });

    it("rejects jersey number out of range", () => {
      expect(() => validate(playerUpdateSchema, { number: 100 })).toThrow(ValidationError);
    });
  });

  describe("goalCreateSchema", () => {
    const validGoal = {
      gameId: uuid(),
      period: 1,
      time: 0,
      strength: "EVEN",
      teamId: uuid(),
      scorerId: uuid(),
    };

    it("accepts valid input", () => {
      expect(() => validate(goalCreateSchema, validGoal)).not.toThrow();
    });

    it("rejects period 0", () => {
      expect(() => validate(goalCreateSchema, { ...validGoal, period: 0 })).toThrow(
        ValidationError,
      );
    });

    it("rejects period 6", () => {
      expect(() => validate(goalCreateSchema, { ...validGoal, period: 6 })).toThrow(
        ValidationError,
      );
    });

    it("accepts period 5 (overtime)", () => {
      expect(() => validate(goalCreateSchema, { ...validGoal, period: 5 })).not.toThrow();
    });

    it("accepts time 0", () => {
      expect(() => validate(goalCreateSchema, { ...validGoal, time: 0 })).not.toThrow();
    });

    it("rejects negative time", () => {
      expect(() => validate(goalCreateSchema, { ...validGoal, time: -1 })).toThrow(ValidationError);
    });

    it("rejects invalid strength", () => {
      expect(() => validate(goalCreateSchema, { ...validGoal, strength: "OVERTIME" })).toThrow(
        ValidationError,
      );
    });
  });

  describe("goalUpdateSchema", () => {
    it("accepts empty update", () => {
      expect(() => validate(goalUpdateSchema, {})).not.toThrow();
    });
  });

  describe("penaltyCreateSchema", () => {
    const validPenalty = {
      gameId: uuid(),
      period: 2,
      time: 30,
      teamId: uuid(),
      playerId: uuid(),
      type: "TRIPPING",
      minutes: 2,
    };

    it("accepts valid input", () => {
      expect(() => validate(penaltyCreateSchema, validPenalty)).not.toThrow();
    });

    it("rejects minutes 0", () => {
      expect(() => validate(penaltyCreateSchema, { ...validPenalty, minutes: 0 })).toThrow(
        ValidationError,
      );
    });

    it("accepts minutes 1", () => {
      expect(() => validate(penaltyCreateSchema, { ...validPenalty, minutes: 1 })).not.toThrow();
    });

    it("rejects invalid penalty type", () => {
      expect(() => validate(penaltyCreateSchema, { ...validPenalty, type: "DIVING" })).toThrow(
        ValidationError,
      );
    });

    it("rejects invalid penalty category", () => {
      expect(() =>
        validate(penaltyCreateSchema, { ...validPenalty, category: "SUPER_MAJOR" }),
      ).toThrow(ValidationError);
    });
  });

  describe("penaltyUpdateSchema", () => {
    it("accepts empty update", () => {
      expect(() => validate(penaltyUpdateSchema, {})).not.toThrow();
    });
  });

  describe("gameCreateSchema", () => {
    const validGame = {
      seasonId: uuid(),
      round: 1,
      date: new Date(),
      time: new Date(),
      location: "Arena",
    };

    it("accepts valid input", () => {
      expect(() => validate(gameCreateSchema, validGame)).not.toThrow();
    });

    it("rejects round 0", () => {
      expect(() => validate(gameCreateSchema, { ...validGame, round: 0 })).toThrow(ValidationError);
    });

    it("rejects empty location", () => {
      expect(() => validate(gameCreateSchema, { ...validGame, location: "" })).toThrow(
        ValidationError,
      );
    });
  });

  describe("seasonCreateSchema", () => {
    const validSeason = {
      leagueId: uuid(),
      name: "Fall 2025",
      startDate: new Date(),
      endDate: new Date(),
    };

    it("accepts valid input", () => {
      expect(() => validate(seasonCreateSchema, validSeason)).not.toThrow();
    });

    it("rejects empty name", () => {
      expect(() => validate(seasonCreateSchema, { ...validSeason, name: "" })).toThrow(
        ValidationError,
      );
    });

    it("rejects invalid leagueId", () => {
      expect(() => validate(seasonCreateSchema, { ...validSeason, leagueId: "bad" })).toThrow(
        ValidationError,
      );
    });
  });

  describe("teamCreateSchema", () => {
    const validTeam = {
      seasonId: uuid(),
      name: "Bruins",
    };

    it("accepts valid input", () => {
      expect(() => validate(teamCreateSchema, validTeam)).not.toThrow();
    });

    it("rejects empty name", () => {
      expect(() => validate(teamCreateSchema, { ...validTeam, name: "" })).toThrow(ValidationError);
    });

    it("rejects invalid managerId", () => {
      expect(() => validate(teamCreateSchema, { ...validTeam, managerId: "not-uuid" })).toThrow(
        ValidationError,
      );
    });

    it("accepts null managerId", () => {
      expect(() => validate(teamCreateSchema, { ...validTeam, managerId: null })).not.toThrow();
    });
  });

  describe("draftPickCreateSchema", () => {
    const validDraftPick = {
      seasonId: uuid(),
      overall: 1,
      round: 1,
      pick: 1,
    };

    it("accepts valid input", () => {
      expect(() => validate(draftPickCreateSchema, validDraftPick)).not.toThrow();
    });

    it("rejects overall 0", () => {
      expect(() => validate(draftPickCreateSchema, { ...validDraftPick, overall: 0 })).toThrow(
        ValidationError,
      );
    });

    it("rejects round 0", () => {
      expect(() => validate(draftPickCreateSchema, { ...validDraftPick, round: 0 })).toThrow(
        ValidationError,
      );
    });

    it("rejects pick 0", () => {
      expect(() => validate(draftPickCreateSchema, { ...validDraftPick, pick: 0 })).toThrow(
        ValidationError,
      );
    });
  });

  describe("draftPickUpdateSchema", () => {
    it("accepts empty update", () => {
      expect(() => validate(draftPickUpdateSchema, {})).not.toThrow();
    });
  });

  describe("validate() fieldErrors", () => {
    it("returns field-level errors with path info", () => {
      try {
        validate(playerCreateSchema, { userId: "bad", seasonId: "bad", number: 0 });
        fail("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const ve = error as ValidationError;
        expect(ve.fieldErrors).toBeDefined();
        expect(ve.fieldErrors!["userId"]).toBeDefined();
        expect(ve.fieldErrors!["userId"]!.length).toBeGreaterThan(0);
      }
    });

    it("has message 'Validation failed'", () => {
      expect(() => validate(playerCreateSchema, { userId: "bad", seasonId: "bad" })).toThrow(
        "Validation failed",
      );
    });
  });
});
