import { execSync } from "child_process";

const setup = () => {
  execSync("npx prisma db push --config tmp/prisma.config.ts");
};

export default setup;
