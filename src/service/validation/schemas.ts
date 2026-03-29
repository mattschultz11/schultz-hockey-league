import { Schema } from "effect";

// --- Reusable field schemas ---

const Name = Schema.Trim.pipe(Schema.minLength(1), Schema.maxLength(255));

const OptionalName = Schema.NullishOr(Name);

const Email = Schema.Trim.pipe(
  Schema.minLength(1),
  Schema.maxLength(255),
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
);

const OptionalString = Schema.NullishOr(Schema.Trim);

const Id = Schema.UUID;
const OptionalId = Schema.NullishOr(Schema.UUID);

const JerseyNumber = Schema.NullishOr(Schema.Int.pipe(Schema.between(1, 99)));
const Rating = Schema.NullishOr(Schema.Number.pipe(Schema.between(1, 5)));
const Period = Schema.Int.pipe(Schema.between(1, 5));
const PenaltyMinutes = Schema.Int.pipe(Schema.greaterThanOrEqualTo(1));
const GameTime = Schema.Int.pipe(Schema.greaterThanOrEqualTo(0));
const PositiveInt = Schema.Int.pipe(Schema.greaterThanOrEqualTo(1));

// --- Enum schemas ---

const RoleEnum = Schema.Literal("PLAYER", "MANAGER", "ADMIN");
const HandednessEnum = Schema.Literal("LEFT", "RIGHT");
const GloveHandEnum = Schema.Literal("LEFT", "RIGHT");
const PositionEnum = Schema.Literal("G", "D", "D_F", "F", "F_D");
const ClassificationEnum = Schema.Literal("ROSTER", "SUBSTITUTE", "INJURED", "SUSPENDED");
const StrengthEnum = Schema.Literal("EVEN", "POWERPLAY", "SHORTHANDED");
const PenaltyCategoryEnum = Schema.Literal(
  "MINOR",
  "MAJOR",
  "MATCH",
  "MISCONDUCT",
  "GAME_MISCONDUCT",
);
const PenaltyTypeEnum = Schema.Literal(
  "ABUSE_OF_OFFICIALS",
  "BOARDING",
  "BUTT_ENDING",
  "CHARGING",
  "CHECKING_FROM_BEHIND",
  "CLIPPING",
  "CROSS_CHECKING",
  "DELAY_OF_GAME",
  "ELBOWING",
  "EMBELLISHMENT",
  "EQUIPMENT",
  "FIGHTING",
  "GOALTENDER_INTERFERENCE",
  "HANDLING_THE_PUCK",
  "HEAD_BUTTING",
  "HIGH_STICKING",
  "HOLDING",
  "HOOKING",
  "ILLEGAL_CHECK_TO_THE_HEAD",
  "ILLEGAL_SUBSTITUTION",
  "INTERFERENCE",
  "KICKING",
  "KNEEING",
  "LEAVING_THE_BENCH",
  "ROUGHING",
  "SLASHING",
  "SLEW_FOOTING",
  "SPEARING",
  "THROWING_EQUIPMENT",
  "TOO_MANY_MEN",
  "TRIPPING",
  "UNSPORTSMANLIKE_CONDUCT",
);

// DateTime values come through GraphQL as Date objects or ISO strings — pass through
const DateTimeField = Schema.Unknown;

// --- Create schemas ---

export const userCreateSchema = Schema.Struct({
  email: Email,
  phone: OptionalString,
  firstName: OptionalName,
  lastName: OptionalName,
  birthday: Schema.optional(DateTimeField),
  handedness: Schema.NullishOr(HandednessEnum),
  gloveHand: Schema.NullishOr(GloveHandEnum),
  role: Schema.optional(RoleEnum),
});

export const userUpdateSchema = Schema.Struct({
  phone: OptionalString,
  firstName: OptionalName,
  lastName: OptionalName,
  birthday: Schema.optional(DateTimeField),
  handedness: Schema.NullishOr(HandednessEnum),
  gloveHand: Schema.NullishOr(GloveHandEnum),
  role: Schema.NullishOr(RoleEnum),
  archivedAt: Schema.optional(DateTimeField),
});

export const leagueCreateSchema = Schema.Struct({
  name: Name,
  description: OptionalString,
  skillLevel: OptionalString,
});

export const leagueUpdateSchema = Schema.Struct({
  name: OptionalName,
  description: OptionalString,
  skillLevel: OptionalString,
});

export const seasonCreateSchema = Schema.Struct({
  leagueId: Id,
  name: Name,
  startDate: DateTimeField,
  endDate: DateTimeField,
  sundays: Schema.optional(Schema.Boolean),
  mondays: Schema.optional(Schema.Boolean),
  tuesdays: Schema.optional(Schema.Boolean),
  wednesdays: Schema.optional(Schema.Boolean),
  thursdays: Schema.optional(Schema.Boolean),
  fridays: Schema.optional(Schema.Boolean),
  saturdays: Schema.optional(Schema.Boolean),
});

export const seasonUpdateSchema = Schema.Struct({
  name: OptionalName,
  startDate: Schema.optional(DateTimeField),
  endDate: Schema.optional(DateTimeField),
  sundays: Schema.NullishOr(Schema.Boolean),
  mondays: Schema.NullishOr(Schema.Boolean),
  tuesdays: Schema.NullishOr(Schema.Boolean),
  wednesdays: Schema.NullishOr(Schema.Boolean),
  thursdays: Schema.NullishOr(Schema.Boolean),
  fridays: Schema.NullishOr(Schema.Boolean),
  saturdays: Schema.NullishOr(Schema.Boolean),
});

export const teamCreateSchema = Schema.Struct({
  seasonId: Id,
  name: Name,
  abbreviation: OptionalString,
  logoUrl: OptionalString,
  primaryColor: OptionalString,
  secondaryColor: OptionalString,
  managerId: OptionalId,
});

export const teamUpdateSchema = Schema.Struct({
  name: OptionalName,
  abbreviation: OptionalString,
  logoUrl: OptionalString,
  primaryColor: OptionalString,
  secondaryColor: OptionalString,
  managerId: OptionalId,
});

export const playerCreateSchema = Schema.Struct({
  userId: Id,
  seasonId: Id,
  classification: Schema.optional(ClassificationEnum),
  teamId: OptionalId,
  position: Schema.NullishOr(PositionEnum),
  number: JerseyNumber,
  playerRating: Rating,
  goalieRating: Rating,
  lockerRating: Rating,
  registrationNumber: OptionalString,
});

export const playerUpdateSchema = Schema.Struct({
  classification: Schema.optional(ClassificationEnum),
  teamId: OptionalId,
  position: Schema.NullishOr(PositionEnum),
  number: JerseyNumber,
  playerRating: Rating,
  goalieRating: Rating,
  lockerRating: Rating,
  registrationNumber: OptionalString,
});

export const gameCreateSchema = Schema.Struct({
  seasonId: Id,
  round: PositiveInt,
  date: DateTimeField,
  time: DateTimeField,
  location: Name,
  homeTeamId: OptionalId,
  awayTeamId: OptionalId,
});

export const gameUpdateSchema = Schema.Struct({
  round: Schema.NullishOr(PositiveInt),
  date: Schema.optional(DateTimeField),
  time: Schema.optional(DateTimeField),
  location: OptionalName,
  homeTeamId: OptionalId,
  awayTeamId: OptionalId,
});

export const goalCreateSchema = Schema.Struct({
  gameId: Id,
  period: Period,
  time: GameTime,
  strength: StrengthEnum,
  teamId: Id,
  scorerId: Id,
  primaryAssistId: OptionalId,
  secondaryAssistId: OptionalId,
});

export const goalUpdateSchema = Schema.Struct({
  period: Schema.NullishOr(Period),
  time: Schema.NullishOr(GameTime),
  strength: Schema.NullishOr(StrengthEnum),
  teamId: OptionalId,
  scorerId: OptionalId,
  primaryAssistId: OptionalId,
  secondaryAssistId: OptionalId,
});

export const penaltyCreateSchema = Schema.Struct({
  gameId: Id,
  period: Period,
  time: GameTime,
  teamId: Id,
  playerId: Id,
  category: Schema.optional(PenaltyCategoryEnum),
  type: PenaltyTypeEnum,
  minutes: PenaltyMinutes,
});

export const penaltyUpdateSchema = Schema.Struct({
  period: Schema.NullishOr(Period),
  time: Schema.NullishOr(GameTime),
  teamId: OptionalId,
  playerId: OptionalId,
  category: Schema.NullishOr(PenaltyCategoryEnum),
  type: Schema.NullishOr(PenaltyTypeEnum),
  minutes: Schema.NullishOr(PenaltyMinutes),
});

export const draftPickCreateSchema = Schema.Struct({
  seasonId: Id,
  overall: PositiveInt,
  round: PositiveInt,
  pick: PositiveInt,
  teamId: OptionalId,
  playerId: OptionalId,
});

export const draftPickUpdateSchema = Schema.Struct({
  overall: Schema.NullishOr(PositiveInt),
  round: Schema.NullishOr(PositiveInt),
  pick: Schema.NullishOr(PositiveInt),
  teamId: OptionalId,
  playerId: OptionalId,
});

export const lineupCreateSchema = Schema.Struct({
  gameId: Id,
  teamId: Id,
  playerId: Id,
});

export const setGameLineupSchema = Schema.Struct({
  gameId: Id,
  teamId: Id,
  playerIds: Schema.Array(Id),
});

export const acceptRegistrationsSchema = Schema.Struct({
  seasonId: Id,
  registrationIds: Schema.Array(Id).pipe(Schema.minItems(1)),
});

const Rounds = Schema.Int.pipe(Schema.between(1, 30));

export const createDraftSchema = Schema.Struct({
  seasonId: Id,
  teamIds: Schema.Array(Id).pipe(Schema.minItems(2)),
  rounds: Rounds,
  rotation: Schema.Literal("CYCLICAL", "SNAKE", "HYBRID"),
  snakeStartRound: Schema.NullishOr(Schema.Int.pipe(Schema.greaterThanOrEqualTo(2))),
});

export const registrationSchema = Schema.Struct({
  seasonId: Id,
  email: Email,
  firstName: OptionalName,
  lastName: OptionalName,
  phone: OptionalString,
  birthday: Schema.optional(DateTimeField),
  handedness: Schema.NullishOr(HandednessEnum),
  gloveHand: Schema.NullishOr(GloveHandEnum),
  position: Schema.NullishOr(PositionEnum),
  playerRating: Rating,
  goalieRating: Rating,
  classification: Schema.optional(ClassificationEnum),
  referral: OptionalString,
});
