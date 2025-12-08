/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from "graphql";

import type {
  DraftPick as PrismaDraftPick,
  Game as PrismaGame,
  Goal as PrismaGoal,
  League as PrismaLeague,
  Penalty as PrismaPenalty,
  Player as PrismaPlayer,
  Season as PrismaSeason,
  Team as PrismaTeam,
  User as PrismaUser,
} from "@/service/prisma";
import type { ServerContext } from "@/types";

export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
  [_ in K]?: never;
};
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  DateTime: { input: Date | string; output: Date | string };
};

export type Role = "PLAYER" | "MANAGER" | "ADMIN";

export type Handedness = "LEFT" | "RIGHT";

export type GloveHand = "LEFT" | "RIGHT";

export type Position = "G" | "D" | "D_F" | "F" | "F_D";

export type Result = "WIN" | "LOSS" | "TIE";

export type Strength = "EVEN" | "POWERPLAY" | "SHORTHANDED";

export type PenaltyCategory = "MINOR" | "MAJOR" | "MATCH" | "MISCONDUCT" | "GAME_MISCONDUCT";

export type PenaltyType =
  | "ABUSE_OF_OFFICIALS"
  | "BOARDING"
  | "BUTT_ENDING"
  | "CHARGING"
  | "CHECKING_FROM_BEHIND"
  | "CLIPPING"
  | "CROSS_CHECKING"
  | "DELAY_OF_GAME"
  | "ELBOWING"
  | "EMBELLISHMENT"
  | "EQUIPMENT"
  | "FIGHTING"
  | "GOALTENDER_INTERFERENCE"
  | "HANDLING_THE_PUCK"
  | "HEAD_BUTTING"
  | "HIGH_STICKING"
  | "HOLDING"
  | "HOOKING"
  | "ILLEGAL_CHECK_TO_THE_HEAD"
  | "ILLEGAL_SUBSTITUTION"
  | "INTERFERENCE"
  | "KICKING"
  | "KNEEING"
  | "LEAVING_THE_BENCH"
  | "ROUGHING"
  | "SLASHING"
  | "SLEW_FOOTING"
  | "SPEARING"
  | "THROWING_EQUIPMENT"
  | "TOO_MANY_MEN"
  | "TRIPPING"
  | "UNSPORTSMANLIKE_CONDUCT";

export type User = {
  __typename?: "User";
  id: Scalars["ID"]["output"];
  email: Scalars["String"]["output"];
  phone?: Maybe<Scalars["String"]["output"]>;
  firstName?: Maybe<Scalars["String"]["output"]>;
  lastName?: Maybe<Scalars["String"]["output"]>;
  birthday?: Maybe<Scalars["DateTime"]["output"]>;
  handedness?: Maybe<Handedness>;
  gloveHand?: Maybe<GloveHand>;
  role: Role;
  seasons: Array<Player>;
  archivedAt?: Maybe<Scalars["DateTime"]["output"]>;
};

export type League = {
  __typename?: "League";
  id: Scalars["ID"]["output"];
  slug: Scalars["String"]["output"];
  name: Scalars["String"]["output"];
  description?: Maybe<Scalars["String"]["output"]>;
  skillLevel?: Maybe<Scalars["String"]["output"]>;
  seasons: Array<Season>;
};

export type LeagueSeasonsArgs = {
  leagueId: Scalars["ID"]["input"];
};

export type Season = {
  __typename?: "Season";
  id: Scalars["ID"]["output"];
  slug: Scalars["String"]["output"];
  league: League;
  leagueId: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  startDate: Scalars["DateTime"]["output"];
  endDate: Scalars["DateTime"]["output"];
  sundays: Scalars["Boolean"]["output"];
  mondays: Scalars["Boolean"]["output"];
  tuesdays: Scalars["Boolean"]["output"];
  wednesdays: Scalars["Boolean"]["output"];
  thursdays: Scalars["Boolean"]["output"];
  fridays: Scalars["Boolean"]["output"];
  saturdays: Scalars["Boolean"]["output"];
  players: Array<Player>;
  teams: Array<Team>;
  games: Array<Game>;
  draft: Array<DraftPick>;
};

export type Team = {
  __typename?: "Team";
  id: Scalars["ID"]["output"];
  slug: Scalars["String"]["output"];
  season: Season;
  seasonId: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  abbreviation?: Maybe<Scalars["String"]["output"]>;
  logoUrl?: Maybe<Scalars["String"]["output"]>;
  primaryColor?: Maybe<Scalars["String"]["output"]>;
  secondaryColor?: Maybe<Scalars["String"]["output"]>;
  manager?: Maybe<Player>;
  managerId?: Maybe<Scalars["ID"]["output"]>;
  players: Array<Player>;
  games: Array<Game>;
  wins: Array<Game>;
  losses: Array<Game>;
  ties: Array<Game>;
  points: Scalars["Int"]["output"];
  goals: Array<Goal>;
  penalties: Array<Penalty>;
  draftPicks: Array<DraftPick>;
};

export type Player = {
  __typename?: "Player";
  id: Scalars["ID"]["output"];
  user: User;
  userId: Scalars["ID"]["output"];
  season: Season;
  seasonId: Scalars["ID"]["output"];
  managedTeam?: Maybe<Team>;
  team?: Maybe<Team>;
  teamId?: Maybe<Scalars["ID"]["output"]>;
  position?: Maybe<Position>;
  number?: Maybe<Scalars["Int"]["output"]>;
  playerRating?: Maybe<Scalars["Int"]["output"]>;
  goalieRating?: Maybe<Scalars["Int"]["output"]>;
  lockerRating?: Maybe<Scalars["Int"]["output"]>;
  registrationNumber?: Maybe<Scalars["String"]["output"]>;
  goals: Array<Goal>;
  assists: Array<Goal>;
  penalties: Array<Penalty>;
  draftPick?: Maybe<DraftPick>;
};

export type Game = {
  __typename?: "Game";
  id: Scalars["ID"]["output"];
  season: Season;
  seasonId: Scalars["ID"]["output"];
  round: Scalars["Int"]["output"];
  date: Scalars["DateTime"]["output"];
  time: Scalars["DateTime"]["output"];
  location: Scalars["String"]["output"];
  homeTeam?: Maybe<Team>;
  homeTeamId?: Maybe<Scalars["ID"]["output"]>;
  homeTeamGoals: Array<Goal>;
  homeTeamResult?: Maybe<Result>;
  homeTeamPoints?: Maybe<Scalars["Int"]["output"]>;
  awayTeam?: Maybe<Team>;
  awayTeamId?: Maybe<Scalars["ID"]["output"]>;
  awayTeamGoals: Array<Goal>;
  awayTeamResult?: Maybe<Result>;
  awayTeamPoints?: Maybe<Scalars["Int"]["output"]>;
  goals: Array<Goal>;
  penalties: Array<Penalty>;
};

export type Goal = {
  __typename?: "Goal";
  id: Scalars["ID"]["output"];
  game: Game;
  gameId: Scalars["ID"]["output"];
  period: Scalars["Int"]["output"];
  time: Scalars["Int"]["output"];
  strength: Strength;
  team: Team;
  teamId: Scalars["ID"]["output"];
  scorer: Player;
  scorerId: Scalars["ID"]["output"];
  primaryAssist?: Maybe<Player>;
  primaryAssistId?: Maybe<Scalars["ID"]["output"]>;
  secondaryAssist?: Maybe<Player>;
  secondaryAssistId?: Maybe<Scalars["ID"]["output"]>;
};

export type Penalty = {
  __typename?: "Penalty";
  id: Scalars["ID"]["output"];
  game: Game;
  gameId: Scalars["ID"]["output"];
  period: Scalars["Int"]["output"];
  time: Scalars["Int"]["output"];
  team: Team;
  teamId: Scalars["ID"]["output"];
  player: Player;
  playerId: Scalars["ID"]["output"];
  category: PenaltyCategory;
  type: PenaltyType;
  minutes: Scalars["Int"]["output"];
};

export type DraftPick = {
  __typename?: "DraftPick";
  id: Scalars["ID"]["output"];
  season: Season;
  seasonId: Scalars["ID"]["output"];
  overall: Scalars["Int"]["output"];
  round: Scalars["Int"]["output"];
  pick: Scalars["Int"]["output"];
  team?: Maybe<Team>;
  teamId?: Maybe<Scalars["ID"]["output"]>;
  player?: Maybe<Player>;
  playerId?: Maybe<Scalars["ID"]["output"]>;
  playerRating?: Maybe<Scalars["Int"]["output"]>;
  goalieRating?: Maybe<Scalars["Int"]["output"]>;
};

export type Query = {
  __typename?: "Query";
  users: Array<User>;
  user?: Maybe<User>;
  leagues: Array<League>;
  league?: Maybe<League>;
  seasons: Array<Season>;
  season?: Maybe<Season>;
  teams: Array<Team>;
  team?: Maybe<Team>;
  players: Array<Player>;
  player?: Maybe<Player>;
  games: Array<Game>;
  game?: Maybe<Game>;
  goals: Array<Goal>;
  goal?: Maybe<Goal>;
  penalties: Array<Penalty>;
  penalty?: Maybe<Penalty>;
  draftPicks: Array<DraftPick>;
  draftPick?: Maybe<DraftPick>;
};

export type QueryUserArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryLeagueArgs = {
  id: Scalars["ID"]["input"];
};

export type QuerySeasonArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryTeamsArgs = {
  seasonId: Scalars["ID"]["input"];
};

export type QueryTeamArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryPlayersArgs = {
  seasonId: Scalars["ID"]["input"];
};

export type QueryPlayerArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryGamesArgs = {
  seasonId: Scalars["ID"]["input"];
};

export type QueryGameArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryGoalsArgs = {
  seasonId: Scalars["ID"]["input"];
};

export type QueryGoalArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryPenaltiesArgs = {
  seasonId: Scalars["ID"]["input"];
};

export type QueryPenaltyArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryDraftPicksArgs = {
  seasonId: Scalars["ID"]["input"];
};

export type QueryDraftPickArgs = {
  id: Scalars["ID"]["input"];
};

export type UserCreateInput = {
  email: Scalars["String"]["input"];
  phone?: InputMaybe<Scalars["String"]["input"]>;
  firstName?: InputMaybe<Scalars["String"]["input"]>;
  lastName?: InputMaybe<Scalars["String"]["input"]>;
  birthday?: InputMaybe<Scalars["DateTime"]["input"]>;
  handedness?: InputMaybe<Handedness>;
  gloveHand?: InputMaybe<GloveHand>;
  role?: Role;
};

export type UserUpdateInput = {
  phone?: InputMaybe<Scalars["String"]["input"]>;
  firstName?: InputMaybe<Scalars["String"]["input"]>;
  lastName?: InputMaybe<Scalars["String"]["input"]>;
  birthday?: InputMaybe<Scalars["DateTime"]["input"]>;
  handedness?: InputMaybe<Handedness>;
  gloveHand?: InputMaybe<GloveHand>;
  role?: InputMaybe<Role>;
  archivedAt?: InputMaybe<Scalars["DateTime"]["input"]>;
};

export type LeagueCreateInput = {
  name: Scalars["String"]["input"];
  description?: InputMaybe<Scalars["String"]["input"]>;
  skillLevel?: InputMaybe<Scalars["String"]["input"]>;
};

export type LeagueUpdateInput = {
  name?: InputMaybe<Scalars["String"]["input"]>;
  description?: InputMaybe<Scalars["String"]["input"]>;
  skillLevel?: InputMaybe<Scalars["String"]["input"]>;
};

export type SeasonCreateInput = {
  leagueId: Scalars["ID"]["input"];
  name: Scalars["String"]["input"];
  startDate: Scalars["DateTime"]["input"];
  endDate: Scalars["DateTime"]["input"];
  sundays?: Scalars["Boolean"]["input"];
  mondays?: Scalars["Boolean"]["input"];
  tuesdays?: Scalars["Boolean"]["input"];
  wednesdays?: Scalars["Boolean"]["input"];
  thursdays?: Scalars["Boolean"]["input"];
  fridays?: Scalars["Boolean"]["input"];
  saturdays?: Scalars["Boolean"]["input"];
};

export type SeasonUpdateInput = {
  name?: InputMaybe<Scalars["String"]["input"]>;
  startDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  endDate?: InputMaybe<Scalars["DateTime"]["input"]>;
  sundays?: InputMaybe<Scalars["Boolean"]["input"]>;
  mondays?: InputMaybe<Scalars["Boolean"]["input"]>;
  tuesdays?: InputMaybe<Scalars["Boolean"]["input"]>;
  wednesdays?: InputMaybe<Scalars["Boolean"]["input"]>;
  thursdays?: InputMaybe<Scalars["Boolean"]["input"]>;
  fridays?: InputMaybe<Scalars["Boolean"]["input"]>;
  saturdays?: InputMaybe<Scalars["Boolean"]["input"]>;
};

export type TeamCreateInput = {
  seasonId: Scalars["ID"]["input"];
  name: Scalars["String"]["input"];
  abbreviation?: InputMaybe<Scalars["String"]["input"]>;
  logoUrl?: InputMaybe<Scalars["String"]["input"]>;
  primaryColor?: InputMaybe<Scalars["String"]["input"]>;
  secondaryColor?: InputMaybe<Scalars["String"]["input"]>;
  managerId?: InputMaybe<Scalars["ID"]["input"]>;
};

export type TeamUpdateInput = {
  name?: InputMaybe<Scalars["String"]["input"]>;
  abbreviation?: InputMaybe<Scalars["String"]["input"]>;
  logoUrl?: InputMaybe<Scalars["String"]["input"]>;
  primaryColor?: InputMaybe<Scalars["String"]["input"]>;
  secondaryColor?: InputMaybe<Scalars["String"]["input"]>;
  managerId?: InputMaybe<Scalars["ID"]["input"]>;
};

export type PlayerCreateInput = {
  userId: Scalars["ID"]["input"];
  seasonId: Scalars["ID"]["input"];
  teamId?: InputMaybe<Scalars["ID"]["input"]>;
  position?: InputMaybe<Position>;
  number?: InputMaybe<Scalars["Int"]["input"]>;
  playerRating?: InputMaybe<Scalars["Int"]["input"]>;
  goalieRating?: InputMaybe<Scalars["Int"]["input"]>;
  lockerRating?: InputMaybe<Scalars["Int"]["input"]>;
  registrationNumber?: InputMaybe<Scalars["String"]["input"]>;
};

export type PlayerUpdateInput = {
  teamId?: InputMaybe<Scalars["ID"]["input"]>;
  position?: InputMaybe<Position>;
  number?: InputMaybe<Scalars["Int"]["input"]>;
  playerRating?: InputMaybe<Scalars["Int"]["input"]>;
  goalieRating?: InputMaybe<Scalars["Int"]["input"]>;
  lockerRating?: InputMaybe<Scalars["Int"]["input"]>;
  registrationNumber?: InputMaybe<Scalars["String"]["input"]>;
};

export type GameCreateInput = {
  seasonId: Scalars["ID"]["input"];
  round: Scalars["Int"]["input"];
  date: Scalars["DateTime"]["input"];
  time: Scalars["DateTime"]["input"];
  location: Scalars["String"]["input"];
  homeTeamId?: InputMaybe<Scalars["ID"]["input"]>;
  awayTeamId?: InputMaybe<Scalars["ID"]["input"]>;
};

export type GameUpdateInput = {
  round?: InputMaybe<Scalars["Int"]["input"]>;
  date?: InputMaybe<Scalars["DateTime"]["input"]>;
  time?: InputMaybe<Scalars["DateTime"]["input"]>;
  location?: InputMaybe<Scalars["String"]["input"]>;
  homeTeamId?: InputMaybe<Scalars["ID"]["input"]>;
  awayTeamId?: InputMaybe<Scalars["ID"]["input"]>;
};

export type GoalCreateInput = {
  gameId: Scalars["ID"]["input"];
  period: Scalars["Int"]["input"];
  time: Scalars["Int"]["input"];
  strength: Strength;
  teamId: Scalars["ID"]["input"];
  scorerId: Scalars["ID"]["input"];
  primaryAssistId?: InputMaybe<Scalars["ID"]["input"]>;
  secondaryAssistId?: InputMaybe<Scalars["ID"]["input"]>;
};

export type GoalUpdateInput = {
  period?: InputMaybe<Scalars["Int"]["input"]>;
  time?: InputMaybe<Scalars["Int"]["input"]>;
  strength?: InputMaybe<Strength>;
  teamId?: InputMaybe<Scalars["ID"]["input"]>;
  scorerId?: InputMaybe<Scalars["ID"]["input"]>;
  primaryAssistId?: InputMaybe<Scalars["ID"]["input"]>;
  secondaryAssistId?: InputMaybe<Scalars["ID"]["input"]>;
};

export type PenaltyCreateInput = {
  gameId: Scalars["ID"]["input"];
  period: Scalars["Int"]["input"];
  time: Scalars["Int"]["input"];
  teamId: Scalars["ID"]["input"];
  playerId: Scalars["ID"]["input"];
  category?: PenaltyCategory;
  type: PenaltyType;
  minutes: Scalars["Int"]["input"];
};

export type PenaltyUpdateInput = {
  period?: InputMaybe<Scalars["Int"]["input"]>;
  time?: InputMaybe<Scalars["Int"]["input"]>;
  teamId?: InputMaybe<Scalars["ID"]["input"]>;
  playerId?: InputMaybe<Scalars["ID"]["input"]>;
  category?: InputMaybe<PenaltyCategory>;
  type?: InputMaybe<PenaltyType>;
  minutes?: InputMaybe<Scalars["Int"]["input"]>;
};

export type DraftPickCreateInput = {
  seasonId: Scalars["ID"]["input"];
  overall: Scalars["Int"]["input"];
  round: Scalars["Int"]["input"];
  pick: Scalars["Int"]["input"];
  teamId?: InputMaybe<Scalars["ID"]["input"]>;
  playerId?: InputMaybe<Scalars["ID"]["input"]>;
};

export type DraftPickUpdateInput = {
  overall?: InputMaybe<Scalars["Int"]["input"]>;
  round?: InputMaybe<Scalars["Int"]["input"]>;
  pick?: InputMaybe<Scalars["Int"]["input"]>;
  teamId?: InputMaybe<Scalars["ID"]["input"]>;
  playerId?: InputMaybe<Scalars["ID"]["input"]>;
};

export type Mutation = {
  __typename?: "Mutation";
  createUser: User;
  updateUser: User;
  deleteUser: User;
  createLeague: League;
  updateLeague: League;
  deleteLeague: League;
  createSeason: Season;
  updateSeason: Season;
  deleteSeason: Season;
  createTeam: Team;
  updateTeam: Team;
  deleteTeam: Team;
  createPlayer: Player;
  updatePlayer: Player;
  deletePlayer: Player;
  createGame: Game;
  updateGame: Game;
  deleteGame: Game;
  createGoal: Goal;
  updateGoal: Goal;
  deleteGoal: Goal;
  createPenalty: Penalty;
  updatePenalty: Penalty;
  deletePenalty: Penalty;
  createDraftPick: DraftPick;
  updateDraftPick: DraftPick;
  deleteDraftPick: DraftPick;
};

export type MutationCreateUserArgs = {
  data: UserCreateInput;
};

export type MutationUpdateUserArgs = {
  id: Scalars["ID"]["input"];
  data: UserUpdateInput;
};

export type MutationDeleteUserArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationCreateLeagueArgs = {
  data: LeagueCreateInput;
};

export type MutationUpdateLeagueArgs = {
  id: Scalars["ID"]["input"];
  data: LeagueUpdateInput;
};

export type MutationDeleteLeagueArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationCreateSeasonArgs = {
  data: SeasonCreateInput;
};

export type MutationUpdateSeasonArgs = {
  id: Scalars["ID"]["input"];
  data: SeasonUpdateInput;
};

export type MutationDeleteSeasonArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationCreateTeamArgs = {
  data: TeamCreateInput;
};

export type MutationUpdateTeamArgs = {
  id: Scalars["ID"]["input"];
  data: TeamUpdateInput;
};

export type MutationDeleteTeamArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationCreatePlayerArgs = {
  data: PlayerCreateInput;
};

export type MutationUpdatePlayerArgs = {
  id: Scalars["ID"]["input"];
  data: PlayerUpdateInput;
};

export type MutationDeletePlayerArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationCreateGameArgs = {
  data: GameCreateInput;
};

export type MutationUpdateGameArgs = {
  id: Scalars["ID"]["input"];
  data: GameUpdateInput;
};

export type MutationDeleteGameArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationCreateGoalArgs = {
  data: GoalCreateInput;
};

export type MutationUpdateGoalArgs = {
  id: Scalars["ID"]["input"];
  data: GoalUpdateInput;
};

export type MutationDeleteGoalArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationCreatePenaltyArgs = {
  data: PenaltyCreateInput;
};

export type MutationUpdatePenaltyArgs = {
  id: Scalars["ID"]["input"];
  data: PenaltyUpdateInput;
};

export type MutationDeletePenaltyArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationCreateDraftPickArgs = {
  data: DraftPickCreateInput;
};

export type MutationUpdateDraftPickArgs = {
  id: Scalars["ID"]["input"];
  data: DraftPickUpdateInput;
};

export type MutationDeleteDraftPickArgs = {
  id: Scalars["ID"]["input"];
};

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<
  TResult,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
  TArgs = Record<PropertyKey, never>,
> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
  TArgs = Record<PropertyKey, never>,
> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<
  TTypes,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo,
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<
  T = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<
  TResult = Record<PropertyKey, never>,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
  TArgs = Record<PropertyKey, never>,
> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  DateTime: ResolverTypeWrapper<Scalars["DateTime"]["output"]>;
  Role: Role;
  Handedness: Handedness;
  GloveHand: GloveHand;
  Position: Position;
  Result: Result;
  Strength: Strength;
  PenaltyCategory: PenaltyCategory;
  PenaltyType: PenaltyType;
  User: ResolverTypeWrapper<PrismaUser>;
  ID: ResolverTypeWrapper<Scalars["ID"]["output"]>;
  String: ResolverTypeWrapper<Scalars["String"]["output"]>;
  League: ResolverTypeWrapper<PrismaLeague>;
  Season: ResolverTypeWrapper<PrismaSeason>;
  Boolean: ResolverTypeWrapper<Scalars["Boolean"]["output"]>;
  Team: ResolverTypeWrapper<PrismaTeam>;
  Int: ResolverTypeWrapper<Scalars["Int"]["output"]>;
  Player: ResolverTypeWrapper<PrismaPlayer>;
  Game: ResolverTypeWrapper<PrismaGame>;
  Goal: ResolverTypeWrapper<PrismaGoal>;
  Penalty: ResolverTypeWrapper<PrismaPenalty>;
  DraftPick: ResolverTypeWrapper<PrismaDraftPick>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  UserCreateInput: UserCreateInput;
  UserUpdateInput: UserUpdateInput;
  LeagueCreateInput: LeagueCreateInput;
  LeagueUpdateInput: LeagueUpdateInput;
  SeasonCreateInput: SeasonCreateInput;
  SeasonUpdateInput: SeasonUpdateInput;
  TeamCreateInput: TeamCreateInput;
  TeamUpdateInput: TeamUpdateInput;
  PlayerCreateInput: PlayerCreateInput;
  PlayerUpdateInput: PlayerUpdateInput;
  GameCreateInput: GameCreateInput;
  GameUpdateInput: GameUpdateInput;
  GoalCreateInput: GoalCreateInput;
  GoalUpdateInput: GoalUpdateInput;
  PenaltyCreateInput: PenaltyCreateInput;
  PenaltyUpdateInput: PenaltyUpdateInput;
  DraftPickCreateInput: DraftPickCreateInput;
  DraftPickUpdateInput: DraftPickUpdateInput;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  DateTime: Scalars["DateTime"]["output"];
  User: PrismaUser;
  ID: Scalars["ID"]["output"];
  String: Scalars["String"]["output"];
  League: PrismaLeague;
  Season: PrismaSeason;
  Boolean: Scalars["Boolean"]["output"];
  Team: PrismaTeam;
  Int: Scalars["Int"]["output"];
  Player: PrismaPlayer;
  Game: PrismaGame;
  Goal: PrismaGoal;
  Penalty: PrismaPenalty;
  DraftPick: PrismaDraftPick;
  Query: Record<PropertyKey, never>;
  UserCreateInput: UserCreateInput;
  UserUpdateInput: UserUpdateInput;
  LeagueCreateInput: LeagueCreateInput;
  LeagueUpdateInput: LeagueUpdateInput;
  SeasonCreateInput: SeasonCreateInput;
  SeasonUpdateInput: SeasonUpdateInput;
  TeamCreateInput: TeamCreateInput;
  TeamUpdateInput: TeamUpdateInput;
  PlayerCreateInput: PlayerCreateInput;
  PlayerUpdateInput: PlayerUpdateInput;
  GameCreateInput: GameCreateInput;
  GameUpdateInput: GameUpdateInput;
  GoalCreateInput: GoalCreateInput;
  GoalUpdateInput: GoalUpdateInput;
  PenaltyCreateInput: PenaltyCreateInput;
  PenaltyUpdateInput: PenaltyUpdateInput;
  DraftPickCreateInput: DraftPickCreateInput;
  DraftPickUpdateInput: DraftPickUpdateInput;
  Mutation: Record<PropertyKey, never>;
};

export interface DateTimeScalarConfig
  extends GraphQLScalarTypeConfig<ResolversTypes["DateTime"], any> {
  name: "DateTime";
}

export type UserResolvers<
  ContextType = ServerContext,
  ParentType extends ResolversParentTypes["User"] = ResolversParentTypes["User"],
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  email?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  phone?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  firstName?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  lastName?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  birthday?: Resolver<Maybe<ResolversTypes["DateTime"]>, ParentType, ContextType>;
  handedness?: Resolver<Maybe<ResolversTypes["Handedness"]>, ParentType, ContextType>;
  gloveHand?: Resolver<Maybe<ResolversTypes["GloveHand"]>, ParentType, ContextType>;
  role?: Resolver<ResolversTypes["Role"], ParentType, ContextType>;
  seasons?: Resolver<Array<ResolversTypes["Player"]>, ParentType, ContextType>;
  archivedAt?: Resolver<Maybe<ResolversTypes["DateTime"]>, ParentType, ContextType>;
};

export type LeagueResolvers<
  ContextType = ServerContext,
  ParentType extends ResolversParentTypes["League"] = ResolversParentTypes["League"],
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  slug?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  skillLevel?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  seasons?: Resolver<
    Array<ResolversTypes["Season"]>,
    ParentType,
    ContextType,
    RequireFields<LeagueSeasonsArgs, "leagueId">
  >;
};

export type SeasonResolvers<
  ContextType = ServerContext,
  ParentType extends ResolversParentTypes["Season"] = ResolversParentTypes["Season"],
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  slug?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  league?: Resolver<ResolversTypes["League"], ParentType, ContextType>;
  leagueId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  startDate?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  endDate?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  sundays?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  mondays?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  tuesdays?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  wednesdays?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  thursdays?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  fridays?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  saturdays?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  players?: Resolver<Array<ResolversTypes["Player"]>, ParentType, ContextType>;
  teams?: Resolver<Array<ResolversTypes["Team"]>, ParentType, ContextType>;
  games?: Resolver<Array<ResolversTypes["Game"]>, ParentType, ContextType>;
  draft?: Resolver<Array<ResolversTypes["DraftPick"]>, ParentType, ContextType>;
};

export type TeamResolvers<
  ContextType = ServerContext,
  ParentType extends ResolversParentTypes["Team"] = ResolversParentTypes["Team"],
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  slug?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  season?: Resolver<ResolversTypes["Season"], ParentType, ContextType>;
  seasonId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  abbreviation?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  logoUrl?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  primaryColor?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  secondaryColor?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  manager?: Resolver<Maybe<ResolversTypes["Player"]>, ParentType, ContextType>;
  managerId?: Resolver<Maybe<ResolversTypes["ID"]>, ParentType, ContextType>;
  players?: Resolver<Array<ResolversTypes["Player"]>, ParentType, ContextType>;
  games?: Resolver<Array<ResolversTypes["Game"]>, ParentType, ContextType>;
  wins?: Resolver<Array<ResolversTypes["Game"]>, ParentType, ContextType>;
  losses?: Resolver<Array<ResolversTypes["Game"]>, ParentType, ContextType>;
  ties?: Resolver<Array<ResolversTypes["Game"]>, ParentType, ContextType>;
  points?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  goals?: Resolver<Array<ResolversTypes["Goal"]>, ParentType, ContextType>;
  penalties?: Resolver<Array<ResolversTypes["Penalty"]>, ParentType, ContextType>;
  draftPicks?: Resolver<Array<ResolversTypes["DraftPick"]>, ParentType, ContextType>;
};

export type PlayerResolvers<
  ContextType = ServerContext,
  ParentType extends ResolversParentTypes["Player"] = ResolversParentTypes["Player"],
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  user?: Resolver<ResolversTypes["User"], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  season?: Resolver<ResolversTypes["Season"], ParentType, ContextType>;
  seasonId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  managedTeam?: Resolver<Maybe<ResolversTypes["Team"]>, ParentType, ContextType>;
  team?: Resolver<Maybe<ResolversTypes["Team"]>, ParentType, ContextType>;
  teamId?: Resolver<Maybe<ResolversTypes["ID"]>, ParentType, ContextType>;
  position?: Resolver<Maybe<ResolversTypes["Position"]>, ParentType, ContextType>;
  number?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>;
  playerRating?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>;
  goalieRating?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>;
  lockerRating?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>;
  registrationNumber?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  goals?: Resolver<Array<ResolversTypes["Goal"]>, ParentType, ContextType>;
  assists?: Resolver<Array<ResolversTypes["Goal"]>, ParentType, ContextType>;
  penalties?: Resolver<Array<ResolversTypes["Penalty"]>, ParentType, ContextType>;
  draftPick?: Resolver<Maybe<ResolversTypes["DraftPick"]>, ParentType, ContextType>;
};

export type GameResolvers<
  ContextType = ServerContext,
  ParentType extends ResolversParentTypes["Game"] = ResolversParentTypes["Game"],
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  season?: Resolver<ResolversTypes["Season"], ParentType, ContextType>;
  seasonId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  round?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  date?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  time?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  location?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  homeTeam?: Resolver<Maybe<ResolversTypes["Team"]>, ParentType, ContextType>;
  homeTeamId?: Resolver<Maybe<ResolversTypes["ID"]>, ParentType, ContextType>;
  homeTeamGoals?: Resolver<Array<ResolversTypes["Goal"]>, ParentType, ContextType>;
  homeTeamResult?: Resolver<Maybe<ResolversTypes["Result"]>, ParentType, ContextType>;
  homeTeamPoints?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>;
  awayTeam?: Resolver<Maybe<ResolversTypes["Team"]>, ParentType, ContextType>;
  awayTeamId?: Resolver<Maybe<ResolversTypes["ID"]>, ParentType, ContextType>;
  awayTeamGoals?: Resolver<Array<ResolversTypes["Goal"]>, ParentType, ContextType>;
  awayTeamResult?: Resolver<Maybe<ResolversTypes["Result"]>, ParentType, ContextType>;
  awayTeamPoints?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>;
  goals?: Resolver<Array<ResolversTypes["Goal"]>, ParentType, ContextType>;
  penalties?: Resolver<Array<ResolversTypes["Penalty"]>, ParentType, ContextType>;
};

export type GoalResolvers<
  ContextType = ServerContext,
  ParentType extends ResolversParentTypes["Goal"] = ResolversParentTypes["Goal"],
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  game?: Resolver<ResolversTypes["Game"], ParentType, ContextType>;
  gameId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  period?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  time?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  strength?: Resolver<ResolversTypes["Strength"], ParentType, ContextType>;
  team?: Resolver<ResolversTypes["Team"], ParentType, ContextType>;
  teamId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  scorer?: Resolver<ResolversTypes["Player"], ParentType, ContextType>;
  scorerId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  primaryAssist?: Resolver<Maybe<ResolversTypes["Player"]>, ParentType, ContextType>;
  primaryAssistId?: Resolver<Maybe<ResolversTypes["ID"]>, ParentType, ContextType>;
  secondaryAssist?: Resolver<Maybe<ResolversTypes["Player"]>, ParentType, ContextType>;
  secondaryAssistId?: Resolver<Maybe<ResolversTypes["ID"]>, ParentType, ContextType>;
};

export type PenaltyResolvers<
  ContextType = ServerContext,
  ParentType extends ResolversParentTypes["Penalty"] = ResolversParentTypes["Penalty"],
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  game?: Resolver<ResolversTypes["Game"], ParentType, ContextType>;
  gameId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  period?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  time?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  team?: Resolver<ResolversTypes["Team"], ParentType, ContextType>;
  teamId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  player?: Resolver<ResolversTypes["Player"], ParentType, ContextType>;
  playerId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  category?: Resolver<ResolversTypes["PenaltyCategory"], ParentType, ContextType>;
  type?: Resolver<ResolversTypes["PenaltyType"], ParentType, ContextType>;
  minutes?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
};

export type DraftPickResolvers<
  ContextType = ServerContext,
  ParentType extends ResolversParentTypes["DraftPick"] = ResolversParentTypes["DraftPick"],
> = {
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  season?: Resolver<ResolversTypes["Season"], ParentType, ContextType>;
  seasonId?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  overall?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  round?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  pick?: Resolver<ResolversTypes["Int"], ParentType, ContextType>;
  team?: Resolver<Maybe<ResolversTypes["Team"]>, ParentType, ContextType>;
  teamId?: Resolver<Maybe<ResolversTypes["ID"]>, ParentType, ContextType>;
  player?: Resolver<Maybe<ResolversTypes["Player"]>, ParentType, ContextType>;
  playerId?: Resolver<Maybe<ResolversTypes["ID"]>, ParentType, ContextType>;
  playerRating?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>;
  goalieRating?: Resolver<Maybe<ResolversTypes["Int"]>, ParentType, ContextType>;
};

export type QueryResolvers<
  ContextType = ServerContext,
  ParentType extends ResolversParentTypes["Query"] = ResolversParentTypes["Query"],
> = {
  users?: Resolver<Array<ResolversTypes["User"]>, ParentType, ContextType>;
  user?: Resolver<
    Maybe<ResolversTypes["User"]>,
    ParentType,
    ContextType,
    RequireFields<QueryUserArgs, "id">
  >;
  leagues?: Resolver<Array<ResolversTypes["League"]>, ParentType, ContextType>;
  league?: Resolver<
    Maybe<ResolversTypes["League"]>,
    ParentType,
    ContextType,
    RequireFields<QueryLeagueArgs, "id">
  >;
  seasons?: Resolver<Array<ResolversTypes["Season"]>, ParentType, ContextType>;
  season?: Resolver<
    Maybe<ResolversTypes["Season"]>,
    ParentType,
    ContextType,
    RequireFields<QuerySeasonArgs, "id">
  >;
  teams?: Resolver<
    Array<ResolversTypes["Team"]>,
    ParentType,
    ContextType,
    RequireFields<QueryTeamsArgs, "seasonId">
  >;
  team?: Resolver<
    Maybe<ResolversTypes["Team"]>,
    ParentType,
    ContextType,
    RequireFields<QueryTeamArgs, "id">
  >;
  players?: Resolver<
    Array<ResolversTypes["Player"]>,
    ParentType,
    ContextType,
    RequireFields<QueryPlayersArgs, "seasonId">
  >;
  player?: Resolver<
    Maybe<ResolversTypes["Player"]>,
    ParentType,
    ContextType,
    RequireFields<QueryPlayerArgs, "id">
  >;
  games?: Resolver<
    Array<ResolversTypes["Game"]>,
    ParentType,
    ContextType,
    RequireFields<QueryGamesArgs, "seasonId">
  >;
  game?: Resolver<
    Maybe<ResolversTypes["Game"]>,
    ParentType,
    ContextType,
    RequireFields<QueryGameArgs, "id">
  >;
  goals?: Resolver<
    Array<ResolversTypes["Goal"]>,
    ParentType,
    ContextType,
    RequireFields<QueryGoalsArgs, "seasonId">
  >;
  goal?: Resolver<
    Maybe<ResolversTypes["Goal"]>,
    ParentType,
    ContextType,
    RequireFields<QueryGoalArgs, "id">
  >;
  penalties?: Resolver<
    Array<ResolversTypes["Penalty"]>,
    ParentType,
    ContextType,
    RequireFields<QueryPenaltiesArgs, "seasonId">
  >;
  penalty?: Resolver<
    Maybe<ResolversTypes["Penalty"]>,
    ParentType,
    ContextType,
    RequireFields<QueryPenaltyArgs, "id">
  >;
  draftPicks?: Resolver<
    Array<ResolversTypes["DraftPick"]>,
    ParentType,
    ContextType,
    RequireFields<QueryDraftPicksArgs, "seasonId">
  >;
  draftPick?: Resolver<
    Maybe<ResolversTypes["DraftPick"]>,
    ParentType,
    ContextType,
    RequireFields<QueryDraftPickArgs, "id">
  >;
};

export type MutationResolvers<
  ContextType = ServerContext,
  ParentType extends ResolversParentTypes["Mutation"] = ResolversParentTypes["Mutation"],
> = {
  createUser?: Resolver<
    ResolversTypes["User"],
    ParentType,
    ContextType,
    RequireFields<MutationCreateUserArgs, "data">
  >;
  updateUser?: Resolver<
    ResolversTypes["User"],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateUserArgs, "id" | "data">
  >;
  deleteUser?: Resolver<
    ResolversTypes["User"],
    ParentType,
    ContextType,
    RequireFields<MutationDeleteUserArgs, "id">
  >;
  createLeague?: Resolver<
    ResolversTypes["League"],
    ParentType,
    ContextType,
    RequireFields<MutationCreateLeagueArgs, "data">
  >;
  updateLeague?: Resolver<
    ResolversTypes["League"],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateLeagueArgs, "id" | "data">
  >;
  deleteLeague?: Resolver<
    ResolversTypes["League"],
    ParentType,
    ContextType,
    RequireFields<MutationDeleteLeagueArgs, "id">
  >;
  createSeason?: Resolver<
    ResolversTypes["Season"],
    ParentType,
    ContextType,
    RequireFields<MutationCreateSeasonArgs, "data">
  >;
  updateSeason?: Resolver<
    ResolversTypes["Season"],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateSeasonArgs, "id" | "data">
  >;
  deleteSeason?: Resolver<
    ResolversTypes["Season"],
    ParentType,
    ContextType,
    RequireFields<MutationDeleteSeasonArgs, "id">
  >;
  createTeam?: Resolver<
    ResolversTypes["Team"],
    ParentType,
    ContextType,
    RequireFields<MutationCreateTeamArgs, "data">
  >;
  updateTeam?: Resolver<
    ResolversTypes["Team"],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateTeamArgs, "id" | "data">
  >;
  deleteTeam?: Resolver<
    ResolversTypes["Team"],
    ParentType,
    ContextType,
    RequireFields<MutationDeleteTeamArgs, "id">
  >;
  createPlayer?: Resolver<
    ResolversTypes["Player"],
    ParentType,
    ContextType,
    RequireFields<MutationCreatePlayerArgs, "data">
  >;
  updatePlayer?: Resolver<
    ResolversTypes["Player"],
    ParentType,
    ContextType,
    RequireFields<MutationUpdatePlayerArgs, "id" | "data">
  >;
  deletePlayer?: Resolver<
    ResolversTypes["Player"],
    ParentType,
    ContextType,
    RequireFields<MutationDeletePlayerArgs, "id">
  >;
  createGame?: Resolver<
    ResolversTypes["Game"],
    ParentType,
    ContextType,
    RequireFields<MutationCreateGameArgs, "data">
  >;
  updateGame?: Resolver<
    ResolversTypes["Game"],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateGameArgs, "id" | "data">
  >;
  deleteGame?: Resolver<
    ResolversTypes["Game"],
    ParentType,
    ContextType,
    RequireFields<MutationDeleteGameArgs, "id">
  >;
  createGoal?: Resolver<
    ResolversTypes["Goal"],
    ParentType,
    ContextType,
    RequireFields<MutationCreateGoalArgs, "data">
  >;
  updateGoal?: Resolver<
    ResolversTypes["Goal"],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateGoalArgs, "id" | "data">
  >;
  deleteGoal?: Resolver<
    ResolversTypes["Goal"],
    ParentType,
    ContextType,
    RequireFields<MutationDeleteGoalArgs, "id">
  >;
  createPenalty?: Resolver<
    ResolversTypes["Penalty"],
    ParentType,
    ContextType,
    RequireFields<MutationCreatePenaltyArgs, "data">
  >;
  updatePenalty?: Resolver<
    ResolversTypes["Penalty"],
    ParentType,
    ContextType,
    RequireFields<MutationUpdatePenaltyArgs, "id" | "data">
  >;
  deletePenalty?: Resolver<
    ResolversTypes["Penalty"],
    ParentType,
    ContextType,
    RequireFields<MutationDeletePenaltyArgs, "id">
  >;
  createDraftPick?: Resolver<
    ResolversTypes["DraftPick"],
    ParentType,
    ContextType,
    RequireFields<MutationCreateDraftPickArgs, "data">
  >;
  updateDraftPick?: Resolver<
    ResolversTypes["DraftPick"],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateDraftPickArgs, "id" | "data">
  >;
  deleteDraftPick?: Resolver<
    ResolversTypes["DraftPick"],
    ParentType,
    ContextType,
    RequireFields<MutationDeleteDraftPickArgs, "id">
  >;
};

export type Resolvers<ContextType = ServerContext> = {
  DateTime?: GraphQLScalarType;
  User?: UserResolvers<ContextType>;
  League?: LeagueResolvers<ContextType>;
  Season?: SeasonResolvers<ContextType>;
  Team?: TeamResolvers<ContextType>;
  Player?: PlayerResolvers<ContextType>;
  Game?: GameResolvers<ContextType>;
  Goal?: GoalResolvers<ContextType>;
  Penalty?: PenaltyResolvers<ContextType>;
  DraftPick?: DraftPickResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
};
