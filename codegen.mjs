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
        contextType: "@/service/types#ServiceContext",
        scalars: {
          DateTime: "Date | string",
        },
        mappers: {
          User: "@/lib/prisma#User as PrismaUser",
          League: "@/lib/prisma#League as PrismaLeague",
          Season: "@/lib/prisma#Season as PrismaSeason",
          Team: "@/lib/prisma#Team as PrismaTeam",
          Player: "@/lib/prisma#Player as PrismaPlayer",
          Game: "@/lib/prisma#Game as PrismaGame",
          Goal: "@/lib/prisma#Goal as PrismaGoal",
          Penalty: "@/lib/prisma#Penalty as PrismaPenalty",
          DraftPick: "@/lib/prisma#DraftPick as PrismaDraftPick",
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
