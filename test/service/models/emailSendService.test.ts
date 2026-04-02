import { randUuid } from "@ngneat/falso";

import { NotFoundError } from "@/service/errors";
import {
  createEmailSend,
  getEmailSendById,
  getEmailSendRecipients,
  getEmailSends,
  updateEmailRecipientStatus,
} from "@/service/models/emailSendService";
import type { ServerContext } from "@/types";

import { insertUser, makeEmailSend } from "../../modelFactory";
import { createCtx } from "../../utils";

describe("emailSendService", () => {
  let ctx: ServerContext;

  beforeAll(async () => {
    ctx = createCtx();
  });

  it("can create an email send with nested recipients", async () => {
    const user = await insertUser();
    const data = {
      ...makeEmailSend({ sentById: user.id }),
      recipients: [
        { address: "alice@example.com", name: "Alice" },
        { address: "bob@example.com", name: "Bob", status: "sent" },
      ],
    };

    const result = await createEmailSend(data, ctx);

    expect(result).toMatchObject({
      subject: data.subject,
      htmlBody: data.htmlBody,
      recipientCount: data.recipientCount,
      sentById: user.id,
    });
  });

  it("can get an email send by id", async () => {
    const user = await insertUser();
    const created = await createEmailSend(
      {
        ...makeEmailSend({ sentById: user.id }),
        recipients: [{ address: "test@example.com" }],
      },
      ctx,
    );

    const found = await getEmailSendById(created.id, ctx);

    expect(found).toMatchObject({ id: created.id, subject: created.subject });
  });

  it("throws NotFoundError for missing email send", async () => {
    await expect(getEmailSendById(randUuid(), ctx)).rejects.toThrow(NotFoundError);
  });

  it("returns email sends ordered by sentAt desc", async () => {
    const user = await insertUser();

    await createEmailSend(
      {
        ...makeEmailSend({ sentById: user.id, subject: "First" }),
        recipients: [{ address: "a@example.com" }],
      },
      ctx,
    );

    await createEmailSend(
      {
        ...makeEmailSend({ sentById: user.id, subject: "Second" }),
        recipients: [{ address: "b@example.com" }],
      },
      ctx,
    );

    const sends = await getEmailSends(ctx);

    expect(sends.length).toBeGreaterThanOrEqual(2);

    // Verify the list is ordered by sentAt descending
    for (let i = 0; i < sends.length - 1; i++) {
      expect(sends[i].sentAt.getTime()).toBeGreaterThanOrEqual(sends[i + 1].sentAt.getTime());
    }
  });

  it("can get recipients for an email send", async () => {
    const user = await insertUser();
    const created = await createEmailSend(
      {
        ...makeEmailSend({ sentById: user.id }),
        recipients: [
          { address: "r1@example.com", name: "R1" },
          { address: "r2@example.com", name: "R2" },
        ],
      },
      ctx,
    );

    const recipients = await getEmailSendRecipients(created.id, ctx);

    expect(recipients).toHaveLength(2);
    expect(recipients.map((r) => r.address).sort()).toEqual(["r1@example.com", "r2@example.com"]);
  });

  it("can update a recipient status", async () => {
    const user = await insertUser();
    const created = await createEmailSend(
      {
        ...makeEmailSend({ sentById: user.id }),
        recipients: [{ address: "update@example.com", status: "queued" }],
      },
      ctx,
    );

    const recipients = await getEmailSendRecipients(created.id, ctx);
    const recipient = recipients[0];

    const updated = await updateEmailRecipientStatus(recipient.id, "delivered", ctx);

    expect(updated.status).toBe("delivered");
  });
});
