export const typeDefs = /* GraphQL */ `
  scalar DateTime

  enum Role {
    PLAYER
    MANAGER
    ADMIN
  }

  enum Handedness {
    LEFT
    RIGHT
  }

  enum GloveHand {
    LEFT
    RIGHT
  }

  enum Position {
    G
    D
    D_F
    F
    F_D
  }

  enum Strength {
    EVEN
    POWERPLAY
    SHORTHANDED
  }

  enum PenaltyCategory {
    MINOR
    MAJOR
    MATCH
    MISCONDUCT
    GAME_MISCONDUCT
  }

  enum PenaltyType {
    ABUSE_OF_OFFICIALS
    BOARDING
    BUTT_ENDING
    CHARGING
    CHECKING_FROM_BEHIND
    CLIPPING
    CROSS_CHECKING
    DELAY_OF_GAME
    ELBOWING
    EMBELLISHMENT
    EQUIPMENT
    FIGHTING
    GOALTENDER_INTERFERENCE
    HANDLING_THE_PUCK
    HEAD_BUTTING
    HIGH_STICKING
    HOLDING
    HOOKING
    ILLEGAL_CHECK_TO_THE_HEAD
    ILLEGAL_SUBSTITUTION
    INTERFERENCE
    KICKING
    KNEEING
    LEAVING_THE_BENCH
    ROUGHING
    SLASHING
    SLEW_FOOTING
    SPEARING
    THROWING_EQUIPMENT
    TOO_MANY_MEN
    TRIPPING
    UNSPORTSMANLIKE_CONDUCT
  }

  type User {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    email: String!
    phone: String
    name: String
    birthday: DateTime
    handedness: Handedness
    gloveHand: GloveHand
    role: Role!
    seasons: [Player!]!
    archivedAt: DateTime
  }

  type League {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    name: String!
    seasons: [Season!]!
  }

  type Season {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    league: League!
    leagueId: ID!
    name: String!
    startDate: DateTime!
    endDate: DateTime!
    players: [Player!]!
    teams: [Team!]!
    games: [Game!]!
    draft: [DraftPick!]!
  }

  type Team {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    season: Season
    seasonId: ID
    name: String!
    manager: Player
    managerId: ID!
    players: [Player!]!
    homeGames: [Game!]!
    awayGames: [Game!]!
    goals: [Goal!]!
    penalties: [Penalty!]!
    draftPicks: [DraftPick!]!
  }

  type Player {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    user: User!
    userId: ID!
    season: Season!
    seasonId: ID!
    managedTeam: Team
    team: Team
    teamId: ID
    position: Position
    number: Int
    playerRating: Int
    goalieRating: Int
    lockerRating: Int
    registrationNumber: String
    goals: [Goal!]!
    primaryAssists: [Goal!]!
    secondaryAssists: [Goal!]!
    penalties: [Penalty!]!
    draftPick: DraftPick
  }

  type Game {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    season: Season!
    seasonId: ID!
    round: Int!
    date: DateTime!
    time: DateTime!
    location: String!
    homeTeam: Team
    homeTeamId: ID
    awayTeam: Team
    awayTeamId: ID!
    goals: [Goal!]!
    penalties: [Penalty!]!
  }

  type Goal {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    game: Game!
    gameId: ID!
    period: Int!
    time: Int!
    strength: Strength!
    team: Team!
    teamId: ID!
    scorer: Player!
    scorerId: ID!
    primaryAssist: Player
    primaryAssistId: ID
    secondaryAssist: Player
    secondaryAssistId: ID
  }

  type Penalty {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    game: Game!
    gameId: ID!
    period: Int!
    time: Int!
    team: Team!
    teamId: ID!
    player: Player!
    playerId: ID!
    category: PenaltyCategory!
    type: PenaltyType!
    minutes: Int!
  }

  type DraftPick {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    season: Season!
    seasonId: ID!
    overall: Int!
    round: Int!
    pick: Int!
    team: Team
    teamId: ID
    player: Player
    playerId: ID
    playerRating: Int
  }

  type Query {
    users: [User!]!
    user(id: ID!): User

    leagues: [League!]!
    league(id: ID!): League

    seasons: [Season!]!
    season(id: ID!): Season

    teams: [Team!]!
    team(id: ID!): Team

    players: [Player!]!
    player(id: ID!): Player

    games: [Game!]!
    game(id: ID!): Game

    goals: [Goal!]!
    goal(id: ID!): Goal

    penalties: [Penalty!]!
    penalty(id: ID!): Penalty

    draftPicks: [DraftPick!]!
    draftPick(id: ID!): DraftPick
  }

  input UserCreateInput {
    email: String!
    phone: String
    name: String
    birthday: DateTime
    handedness: Handedness
    gloveHand: GloveHand
    role: Role! = PLAYER
  }

  input UserUpdateInput {
    phone: String
    name: String
    birthday: DateTime
    handedness: Handedness
    gloveHand: GloveHand
    role: Role
    archivedAt: DateTime
  }

  input LeagueCreateInput {
    name: String!
  }

  input LeagueUpdateInput {
    name: String
  }

  input SeasonCreateInput {
    leagueId: ID!
    name: String!
    startDate: DateTime!
    endDate: DateTime!
  }

  input SeasonUpdateInput {
    name: String
    startDate: DateTime
    endDate: DateTime
  }

  input TeamCreateInput {
    seasonId: ID
    name: String!
    managerId: ID!
  }

  input TeamUpdateInput {
    name: String
    managerId: ID
  }

  input PlayerCreateInput {
    userId: ID!
    seasonId: ID!
    teamId: ID
    position: Position
    number: Int
    playerRating: Int
    goalieRating: Int
    lockerRating: Int
    registrationNumber: String
  }

  input PlayerUpdateInput {
    teamId: ID
    position: Position
    number: Int
    playerRating: Int
    goalieRating: Int
    lockerRating: Int
    registrationNumber: String
  }

  input GameCreateInput {
    seasonId: ID!
    round: Int!
    date: DateTime!
    time: DateTime!
    location: String!
    homeTeamId: ID
    awayTeamId: ID
  }

  input GameUpdateInput {
    round: Int
    date: DateTime
    time: DateTime
    location: String
    homeTeamId: ID
    awayTeamId: ID
  }

  input GoalCreateInput {
    gameId: ID!
    period: Int!
    time: Int!
    strength: Strength!
    teamId: ID!
    scorerId: ID!
    primaryAssistId: ID
    secondaryAssistId: ID
  }

  input GoalUpdateInput {
    period: Int
    time: Int
    strength: Strength
    teamId: ID
    scorerId: ID
    primaryAssistId: ID
    secondaryAssistId: ID
  }

  input PenaltyCreateInput {
    gameId: ID!
    period: Int!
    time: Int!
    teamId: ID!
    playerId: ID!
    category: PenaltyCategory! = MINOR
    type: PenaltyType!
    minutes: Int!
  }

  input PenaltyUpdateInput {
    period: Int
    time: Int
    teamId: ID
    playerId: ID
    category: PenaltyCategory
    type: PenaltyType
    minutes: Int
  }

  input DraftPickCreateInput {
    seasonId: ID!
    overall: Int!
    round: Int!
    pick: Int!
    teamId: ID
    playerId: ID
  }

  input DraftPickUpdateInput {
    overall: Int
    round: Int
    pick: Int
    teamId: ID
    playerId: ID
  }

  type Mutation {
    createUser(data: UserCreateInput!): User!
    updateUser(id: ID!, data: UserUpdateInput!): User!
    deleteUser(id: ID!): User!

    createLeague(data: LeagueCreateInput!): League!
    updateLeague(id: ID!, data: LeagueUpdateInput!): League!
    deleteLeague(id: ID!): League!

    createSeason(data: SeasonCreateInput!): Season!
    updateSeason(id: ID!, data: SeasonUpdateInput!): Season!
    deleteSeason(id: ID!): Season!

    createTeam(data: TeamCreateInput!): Team!
    updateTeam(id: ID!, data: TeamUpdateInput!): Team!
    deleteTeam(id: ID!): Team!

    createPlayer(data: PlayerCreateInput!): Player!
    updatePlayer(id: ID!, data: PlayerUpdateInput!): Player!
    deletePlayer(id: ID!): Player!

    createGame(data: GameCreateInput!): Game!
    updateGame(id: ID!, data: GameUpdateInput!): Game!
    deleteGame(id: ID!): Game!

    createGoal(data: GoalCreateInput!): Goal!
    updateGoal(id: ID!, data: GoalUpdateInput!): Goal!
    deleteGoal(id: ID!): Goal!

    createPenalty(data: PenaltyCreateInput!): Penalty!
    updatePenalty(id: ID!, data: PenaltyUpdateInput!): Penalty!
    deletePenalty(id: ID!): Penalty!

    createDraftPick(data: DraftPickCreateInput!): DraftPick!
    updateDraftPick(id: ID!, data: DraftPickUpdateInput!): DraftPick!
    deleteDraftPick(id: ID!): DraftPick!
  }
`;
