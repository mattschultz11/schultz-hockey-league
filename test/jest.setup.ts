import "@testing-library/jest-dom";
import "./jest.polyfill";

import { seed } from "@ngneat/falso";

import prisma from "@/service/prisma";

jest.mock("@/service/prisma");

async function clearDatabase() {
  await prisma.draftPick.deleteMany();
  await prisma.penalty.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.game.deleteMany();
  await prisma.player.deleteMany();
  await prisma.team.deleteMany();
  await prisma.season.deleteMany();
  await prisma.league.deleteMany();
  await prisma.user.deleteMany();
}

seed("shl");

beforeAll(async () => {
  await clearDatabase();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});
