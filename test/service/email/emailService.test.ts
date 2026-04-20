import { renderTemplate, sendBulkEmail, sendEmail } from "@/service/email/emailService";

const mockCreate = jest.fn();

jest.mock("@/service/email/emailClient", () => ({
  __esModule: true,
  default: () => ({
    messages: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
  }),
  MAILGUN_DOMAIN: "test.example.com",
  assertConfigured: () => {},
}));

describe("emailService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sendEmail", () => {
    it("sends with correct params and returns result", async () => {
      mockCreate.mockResolvedValue({
        id: "<msg-id-123>",
        message: "Queued. Thank you.",
      });

      const result = await sendEmail({
        to: "user@example.com",
        subject: "Test Subject",
        html: "<p>Hello</p>",
        text: "Hello",
      });

      expect(mockCreate).toHaveBeenCalledWith("test.example.com", {
        from: "Schultz Hockey League <noreply@test.example.com>",
        to: "user@example.com",
        subject: "Test Subject",
        html: "<p>Hello</p>",
        text: "Hello",
      });
      expect(result).toEqual({
        id: "<msg-id-123>",
        message: "Queued. Thank you.",
      });
    });

    it("sends without text when not provided", async () => {
      mockCreate.mockResolvedValue({ id: "<id>", message: "Queued." });

      await sendEmail({
        to: "user@example.com",
        subject: "No text",
        html: "<p>Hi</p>",
      });

      expect(mockCreate).toHaveBeenCalledWith("test.example.com", {
        from: "Schultz Hockey League <noreply@test.example.com>",
        to: "user@example.com",
        subject: "No text",
        html: "<p>Hi</p>",
      });
    });

    it("catches Mailgun errors and returns failure result", async () => {
      mockCreate.mockRejectedValue(new Error("API key invalid"));

      const result = await sendEmail({
        to: "user@example.com",
        subject: "Test",
        html: "<p>Hi</p>",
      });

      expect(result).toEqual({
        id: "",
        message: "Failed to send email: API key invalid",
      });
    });
  });

  describe("renderTemplate", () => {
    it("replaces simple variables", () => {
      const result = renderTemplate("Hello {{name}}", { name: "Matt" });
      expect(result).toBe("Hello Matt");
    });

    it("replaces nested dot-notation variables", () => {
      const data = {
        player: {
          user: { firstName: "Alice", lastName: "Smith" },
          team: { name: "Red Wings" },
        },
      };
      const result = renderTemplate(
        "Hi {{player.user.firstName}} from {{player.team.name}}!",
        data,
      );
      expect(result).toBe("Hi Alice from Red Wings!");
    });

    it("replaces missing variables with empty string", () => {
      const result = renderTemplate("Hi {{player.user.firstName}}", { player: { user: {} } });
      expect(result).toBe("Hi ");
    });

    it("handles null intermediate values gracefully", () => {
      const result = renderTemplate("Team: {{player.team.name}}", { player: { team: null } });
      expect(result).toBe("Team: ");
    });

    it("handles numeric and boolean values", () => {
      const result = renderTemplate("#{{player.number}} ({{player.position}})", {
        player: { number: 42, position: "F" },
      });
      expect(result).toBe("#42 (F)");
    });

    it("preserves non-template content", () => {
      const result = renderTemplate("<p>No variables here</p>", {});
      expect(result).toBe("<p>No variables here</p>");
    });
  });

  describe("sendBulkEmail", () => {
    it("sends batch with recipient variables", async () => {
      mockCreate.mockResolvedValue({
        id: "<bulk-id>",
        message: "Queued.",
      });

      const result = await sendBulkEmail({
        recipients: [
          { email: "a@example.com", name: "Alice", variables: { team: "Red" } },
          { email: "b@example.com", name: "Bob" },
        ],
        subject: "Bulk Test",
        html: "<p>Hello %recipient.name%</p>",
        text: "Hello",
      });

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith("test.example.com", {
        from: "Schultz Hockey League <noreply@test.example.com>",
        to: ["a@example.com", "b@example.com"],
        subject: "Bulk Test",
        html: "<p>Hello %recipient.name%</p>",
        text: "Hello",
        "recipient-variables": JSON.stringify({
          "a@example.com": { name: "Alice", team: "Red" },
          "b@example.com": { name: "Bob" },
        }),
      });
      expect(result).toEqual({ totalSent: 2, failures: [] });
    });

    it("chunks recipients into batches of 1000", async () => {
      mockCreate.mockResolvedValue({ id: "<id>", message: "Queued." });

      const recipients = Array.from({ length: 2500 }, (_, i) => ({
        email: `user${i}@example.com`,
        name: `User ${i}`,
      }));

      const result = await sendBulkEmail({
        recipients,
        subject: "Chunked",
        html: "<p>Hi</p>",
      });

      expect(mockCreate).toHaveBeenCalledTimes(3);

      // First batch: 1000 recipients
      const firstCall = mockCreate.mock.calls[0][1];
      expect(firstCall.to).toHaveLength(1000);

      // Second batch: 1000 recipients
      const secondCall = mockCreate.mock.calls[1][1];
      expect(secondCall.to).toHaveLength(1000);

      // Third batch: 500 recipients
      const thirdCall = mockCreate.mock.calls[2][1];
      expect(thirdCall.to).toHaveLength(500);

      expect(result).toEqual({ totalSent: 2500, failures: [] });
    });

    it("collects failures per-recipient when a batch fails", async () => {
      mockCreate
        .mockResolvedValueOnce({ id: "<id>", message: "Queued." })
        .mockRejectedValueOnce(new Error("Rate limit exceeded"));

      const recipients = Array.from({ length: 1500 }, (_, i) => ({
        email: `user${i}@example.com`,
      }));

      const result = await sendBulkEmail({
        recipients,
        subject: "Partial fail",
        html: "<p>Hi</p>",
      });

      expect(result.totalSent).toBe(1000);
      expect(result.failures).toHaveLength(500);
      expect(result.failures[0]).toEqual({
        email: "user1000@example.com",
        error: "Rate limit exceeded",
      });
      expect(result.failures[499]).toEqual({
        email: "user1499@example.com",
        error: "Rate limit exceeded",
      });
    });
  });
});
