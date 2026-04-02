import FormData from "form-data";
import Mailgun from "mailgun.js";

const mailgun = new Mailgun(FormData);

let _client: ReturnType<InstanceType<typeof Mailgun>["client"]> | null = null;

function getClient() {
  if (!_client) {
    _client = mailgun.client({
      username: "api",
      key: process.env.MAILGUN_API_KEY!,
    });
  }
  return _client;
}

export default getClient;
export const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN ?? "";

export function assertConfigured() {
  if (!process.env.MAILGUN_API_KEY) throw new Error("MAILGUN_API_KEY is not configured");
  if (!MAILGUN_DOMAIN) throw new Error("MAILGUN_DOMAIN is not configured");
}
