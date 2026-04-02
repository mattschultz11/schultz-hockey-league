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

  enum Result {
    WIN
    LOSS
    TIE
  }

  enum Strength {
    EVEN
    POWERPLAY
    SHORTHANDED
  }

  enum Classification {
    ROSTER
    SUBSTITUTE
    INJURED
    SUSPENDED
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
    email: String!
    phone: String
    firstName: String
    lastName: String
    birthday: DateTime
    handedness: Handedness
    gloveHand: GloveHand
    role: Role!
    seasons: [Player!]!
    archivedAt: DateTime
  }

  type League {
    id: ID!
    slug: String!
    name: String!
    description: String
    skillLevel: String
    seasons(leagueId: ID!): [Season!]!
  }

  type Season {
    id: ID!
    slug: String!
    league: League!
    leagueId: ID!
    name: String!
    info: String
    startDate: DateTime!
    endDate: DateTime!
    sundays: Boolean!
    mondays: Boolean!
    tuesdays: Boolean!
    wednesdays: Boolean!
    thursdays: Boolean!
    fridays: Boolean!
    saturdays: Boolean!
    players: [Player!]!
    teams: [Team!]!
    games: [Game!]!
    draft: [DraftPick!]!
    registrations: [Registration!]!
  }

  type Team {
    id: ID!
    slug: String!
    season: Season!
    seasonId: ID!
    name: String!
    abbreviation: String
    logoUrl: String
    primaryColor: String
    secondaryColor: String
    manager: Player
    managerId: ID
    players: [Player!]!
    games: [Game!]!
    wins: [Game!]!
    losses: [Game!]!
    ties: [Game!]!
    points: Int!
    goals: [Goal!]!
    goalsAgainst: [Goal!]!
    penalties: [Penalty!]!
    draftPicks: [DraftPick!]!
  }

  type Player {
    id: ID!
    user: User!
    userId: ID!
    season: Season!
    seasonId: ID!
    classification: Classification!
    managedTeam: Team
    team: Team
    teamId: ID
    position: Position
    number: Int
    playerRating: Float
    goalieRating: Float
    lockerRating: Float
    registrationNumber: String
    confirmed: Boolean
    goals: [Goal!]!
    assists: [Goal!]!
    penalties: [Penalty!]!
    draftPick: DraftPick
    lineups: [Lineup!]!
  }

  type Game {
    id: ID!
    season: Season!
    seasonId: ID!
    round: Int!
    date: DateTime!
    time: DateTime!
    location: String!
    homeTeam: Team
    homeTeamId: ID
    homeTeamGoals: [Goal!]!
    homeTeamResult: Result
    homeTeamPoints: Int
    awayTeam: Team
    awayTeamId: ID
    awayTeamGoals: [Goal!]!
    awayTeamResult: Result
    awayTeamPoints: Int
    goals: [Goal!]!
    penalties: [Penalty!]!
    lineups: [Lineup!]!
  }

  type Goal {
    id: ID!
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

  type Lineup {
    id: ID!
    game: Game!
    gameId: ID!
    team: Team!
    teamId: ID!
    player: Player!
    playerId: ID!
  }

  type DraftPick {
    id: ID!
    season: Season!
    seasonId: ID!
    overall: Int!
    round: Int!
    pick: Int!
    team: Team
    teamId: ID
    player: Player
    playerId: ID
    playerRating: Float
    goalieRating: Float
  }

  type DraftBoard {
    currentPick: DraftPick
    nextPick: DraftPick
    draftPicks: [DraftPick!]!
    teams: [Team!]!
    availablePlayers: [Player!]!
  }

  type Registration {
    id: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
    season: Season!
    seasonId: ID!
    email: String!
    firstName: String
    lastName: String
    phone: String
    birthday: DateTime
    handedness: Handedness
    gloveHand: GloveHand
    position: Position
    playerRating: Float
    goalieRating: Float
    classification: Classification!
    referral: String
  }

  enum AuditAction {
    CREATE
    UPDATE
    DELETE
  }

  type AuditLog {
    id: ID!
    timestamp: DateTime!
    requestId: String!
    actorId: ID
    actorRole: Role
    action: AuditAction!
    entityType: String!
    entityId: String!
    metadata: String
    endpoint: String!
  }

  type Query {
    users: [User!]!
    user(id: ID!): User

    leagues: [League!]!
    league(id: ID!): League

    seasons(leagueId: ID!): [Season!]!
    season(id: ID!): Season

    teams(seasonId: ID!): [Team!]!
    team(id: ID!): Team

    players(seasonId: ID!): [Player!]!
    player(id: ID!): Player
    playerCatalog(filter: PlayerCatalogFilter!): [Player!]!

    games(seasonId: ID!): [Game!]!
    game(id: ID!): Game

    goals(seasonId: ID!): [Goal!]!
    goal(id: ID!): Goal

    penalties(seasonId: ID!): [Penalty!]!
    penalty(id: ID!): Penalty

    lineups(gameId: ID!): [Lineup!]!
    gameTeamLineup(gameId: ID!, teamId: ID!): [Lineup!]!

    draftPicks(seasonId: ID!): [DraftPick!]!
    draftPick(id: ID!): DraftPick
    draftBoard(seasonId: ID!): DraftBoard!

    registrations(seasonId: ID!): [Registration!]!
    registration(id: ID!): Registration

    auditLog(
      entityType: String
      actorId: ID
      action: AuditAction
      limit: Int
      offset: Int
    ): [AuditLog!]!

    emailHistory(limit: Int, offset: Int): [EmailSend!]!
    emailSend(id: ID!): EmailSend
  }

  input PlayerCatalogFilter {
    seasonId: ID!
    search: String
    position: Position
    positions: [Position!]
    available: Boolean
    classification: Classification
    classifications: [Classification!]
    teamIds: [ID!]
    minPlayerRating: Float
    maxPlayerRating: Float
    minGoalieRating: Float
    maxGoalieRating: Float
  }

  input UserCreateInput {
    email: String!
    phone: String
    firstName: String
    lastName: String
    birthday: DateTime
    handedness: Handedness
    gloveHand: GloveHand
    role: Role! = PLAYER
  }

  input UserUpdateInput {
    phone: String
    firstName: String
    lastName: String
    birthday: DateTime
    handedness: Handedness
    gloveHand: GloveHand
    role: Role
    archivedAt: DateTime
  }

  input LeagueCreateInput {
    name: String!
    description: String
    skillLevel: String
  }

  input LeagueUpdateInput {
    name: String
    description: String
    skillLevel: String
  }

  input SeasonCreateInput {
    leagueId: ID!
    name: String!
    startDate: DateTime!
    endDate: DateTime!
    sundays: Boolean! = false
    mondays: Boolean! = false
    tuesdays: Boolean! = false
    wednesdays: Boolean! = false
    thursdays: Boolean! = false
    fridays: Boolean! = false
    saturdays: Boolean! = false
  }

  input SeasonUpdateInput {
    name: String
    startDate: DateTime
    endDate: DateTime
    sundays: Boolean
    mondays: Boolean
    tuesdays: Boolean
    wednesdays: Boolean
    thursdays: Boolean
    fridays: Boolean
    saturdays: Boolean
  }

  input TeamCreateInput {
    seasonId: ID!
    name: String!
    abbreviation: String
    logoUrl: String
    primaryColor: String
    secondaryColor: String
    managerId: ID
  }

  input TeamUpdateInput {
    name: String
    abbreviation: String
    logoUrl: String
    primaryColor: String
    secondaryColor: String
    managerId: ID
  }

  input PlayerCreateInput {
    userId: ID!
    seasonId: ID!
    classification: Classification
    teamId: ID
    position: Position
    number: Int
    playerRating: Float
    goalieRating: Float
    lockerRating: Float
    registrationNumber: String
  }

  input PlayerUpdateInput {
    classification: Classification
    teamId: ID
    position: Position
    number: Int
    playerRating: Float
    goalieRating: Float
    lockerRating: Float
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

  input LineupCreateInput {
    gameId: ID!
    teamId: ID!
    playerId: ID!
  }

  input SetGameLineupInput {
    gameId: ID!
    teamId: ID!
    playerIds: [ID!]!
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

    addPlayerToLineup(data: LineupCreateInput!): Lineup!
    removePlayerFromLineup(id: ID!): Lineup!
    setGameLineup(data: SetGameLineupInput!): [Lineup!]!

    createDraftPick(data: DraftPickCreateInput!): DraftPick!
    updateDraftPick(id: ID!, data: DraftPickUpdateInput!): DraftPick!
    deleteDraftPick(id: ID!): DraftPick!
    recordPick(teamId: ID!, playerId: ID!): DraftPick!

    register(data: RegistrationInput!): Registration!

    createDraft(data: CreateDraftInput!): [DraftPick!]!

    acceptRegistrations(seasonId: ID!, registrationIds: [ID!]!): [Player!]!

    sendBulkEmail(data: SendBulkEmailInput!): SendBulkEmailResult!

    confirmPlayer(id: ID!, confirmed: Boolean!): Player!
  }

  enum DraftRotation {
    CYCLICAL
    SNAKE
    HYBRID
  }

  input CreateDraftInput {
    seasonId: ID!
    teamIds: [ID!]!
    rounds: Int!
    rotation: DraftRotation!
    snakeStartRound: Int
  }

  type EmailSend {
    id: ID!
    createdAt: DateTime!
    subject: String!
    htmlBody: String!
    textBody: String
    recipientCount: Int!
    status: String!
    sentAt: DateTime!
    sentById: ID!
    recipients: [EmailRecipient!]!
  }

  type EmailRecipient {
    id: ID!
    emailSendId: ID!
    address: String!
    name: String
    status: String!
  }

  type SendBulkEmailResult {
    emailSend: EmailSend!
    totalSent: Int!
    failures: [EmailFailure!]!
  }

  type EmailFailure {
    email: String!
    error: String!
  }

  input SendBulkEmailInput {
    seasonId: ID!
    recipientEmails: [String!]!
    subject: String!
    html: String!
    text: String
  }

  input RegistrationInput {
    seasonId: ID!
    email: String!
    firstName: String!
    lastName: String!
    phone: String!
    birthday: DateTime!
    handedness: Handedness
    gloveHand: GloveHand
    position: Position!
    playerRating: Float
    goalieRating: Float
    classification: Classification
    referral: String
  }
`;
