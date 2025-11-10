/* eslint-disable @typescript-eslint/no-require-imports */
require("ts-node/register/transpile-only");

const { codegen } = require("@graphql-codegen/core");
const typescriptPlugin = require("@graphql-codegen/typescript");
const typescriptResolversPlugin = require("@graphql-codegen/typescript-resolvers");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { writeFileSync } = require("node:fs");

const { typeDefs } = require("./src/graphql/type-defs");

const schema = makeExecutableSchema({ typeDefs });

(async () => {
  try {
    console.log("Starting codegen...");
    const output = await codegen({
      filename: "src/graphql/generated.ts",
      schema,
      documents: [],
      config: {
        contextType: "../services/types#ServiceContext",
        scalars: {
          DateTime: "Date | string",
        },
        mappers: {
          User: "@prisma/client#User as PrismaUser",
          League: "@prisma/client#League as PrismaLeague",
          Season: "@prisma/client#Season as PrismaSeason",
          Team: "@prisma/client#Team as PrismaTeam",
          Player: "@prisma/client#Player as PrismaPlayer",
          Game: "@prisma/client#Game as PrismaGame",
          Goal: "@prisma/client#Goal as PrismaGoal",
          Penalty: "@prisma/client#Penalty as PrismaPenalty",
          DraftPick: "@prisma/client#DraftPick as PrismaDraftPick",
        },
      },
      plugins: [{ typescript: {} }, { typescriptResolvers: {} }],
      pluginMap: {
        typescript: typescriptPlugin,
        typescriptResolvers: typescriptResolversPlugin,
      },
    });

    const header = "/* eslint-disable @typescript-eslint/no-explicit-any */\n";
    writeFileSync("src/graphql/generated.ts", `${header}${output}`);
    console.log("Codegen complete");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
