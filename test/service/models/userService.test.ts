import { randUuid } from "@ngneat/falso";

import { NotFoundError } from "@/service/errors";
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "@/service/models/userService";
import type { ServerContext } from "@/types";

import { makeUser } from "../../modelFactory";
import { createCtx } from "../../utils";

describe("userService", () => {
  let ctx: ServerContext;

  beforeAll(async () => {
    ctx = createCtx();
  });

  it("can create a user", async () => {
    const input = makeUser();

    const actual = await createUser(input, ctx);

    expect(actual).toMatchObject(input);
  });

  it("throws when updating a user with a null role", async () => {
    const user = await createUser(makeUser(), ctx);

    expect(() => updateUser(user.id, { role: null }, ctx)).toThrow("role cannot be null");
  });

  it("can get a user by id", async () => {
    const user = await createUser(makeUser(), ctx);

    const found = await getUserById(user.id, ctx);

    expect(found).toMatchObject(user);
  });

  it("throws NotFoundError when getting a non-existent user", async () => {
    await expect(getUserById(randUuid(), ctx)).rejects.toThrow(NotFoundError);
  });

  it("can list all users", async () => {
    await createUser(makeUser(), ctx);
    await createUser(makeUser(), ctx);

    const users = await getUsers(ctx);

    expect(users.length).toBeGreaterThanOrEqual(2);
  });

  it("can update a user", async () => {
    const user = await createUser(makeUser(), ctx);

    const updated = await updateUser(user.id, { firstName: "Updated" }, ctx);

    expect(updated.firstName).toBe("Updated");
  });

  it("can delete a user", async () => {
    const user = await createUser(makeUser(), ctx);

    await deleteUser(user.id, ctx);

    await expect(getUserById(user.id, ctx)).rejects.toThrow(NotFoundError);
  });
});
