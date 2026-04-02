import { execSync } from "child_process";
import { codegen } from "@graphql-codegen/core";
import * as typescriptPlugin from "@graphql-codegen/typescript";
import * as typescriptResolversPlugin from "@graphql-codegen/typescript-resolvers";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { writeFileSync } from "fs";

import { typeDefs } from "./src/graphql/type-defs.mjs";

const schema = makeExecutableSchema({ typeDefs });

(async () => {
  try {
    console.log("Starting codegen...");
    const output = await codegen({
      filename: "src/graphql/generated.ts",
      schema,
      documents: [],
      config: {
        enumsAsTypes: true,
        contextType: "@/types#ServerContext",
        scalars: {
          DateTime: "Date | string",
        },
        mappers: {
          User: "@/service/prisma#User as PrismaUser",
          League: "@/service/prisma#League as PrismaLeague",
          Season: "@/service/prisma#Season as PrismaSeason",
          Team: "@/service/prisma#Team as PrismaTeam",
          Player: "@/service/prisma#Player as PrismaPlayer",
          Game: "@/service/prisma#Game as PrismaGame",
          Goal: "@/service/prisma#Goal as PrismaGoal",
          Penalty: "@/service/prisma#Penalty as PrismaPenalty",
          Lineup: "@/service/prisma#Lineup as PrismaLineup",
          DraftPick: "@/service/prisma#DraftPick as PrismaDraftPick",
          Registration: "@/service/prisma#Registration as PrismaRegistration",
          EmailSend: "@/service/prisma#EmailSend as PrismaEmailSend",
          EmailRecipient: "@/service/prisma#EmailRecipient as PrismaEmailRecipient",
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
    execSync("npx eslint --fix src/graphql/generated.ts");
    execSync("npx prettier --write src/graphql/generated.ts");
    console.log("Codegen complete");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
