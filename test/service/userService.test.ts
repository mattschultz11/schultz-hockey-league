import type { ServiceContext } from "@/service/types";
import { createUser, updateUser } from "@/service/userService";

import { makeUser } from "../modelFactory";
import { createCtx } from "../utils";

describe("userService", () => {
  let ctx: ServiceContext;

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
});
