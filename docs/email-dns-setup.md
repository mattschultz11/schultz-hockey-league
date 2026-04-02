# Email & DNS Setup

## Overview

The app uses two services for email:

- **Mailgun** -- outbound transactional emails sent from `noreply@yourdomain.com`
- **ImprovMX** -- inbound forwarding from `support@yourdomain.com` to Gmail

Both services share the same domain and their DNS records coexist without conflict.

## ImprovMX Setup (Inbound Forwarding)

ImprovMX forwards emails sent to your domain to an existing Gmail (or other) inbox.

### Configuration

1. Sign up at [improvmx.com](https://improvmx.com)
2. Add your domain
3. Create an alias: `support@yourdomain.com` -> your Gmail address
4. Add the MX records below to your DNS

### Required DNS Records

| Type | Name           | Value            | Priority |
| ---- | -------------- | ---------------- | -------- |
| MX   | yourdomain.com | mx1.improvmx.com | 10       |
| MX   | yourdomain.com | mx2.improvmx.com | 20       |

### Free Tier Limits

- 25 aliases
- 500 emails/day forwarding

## Mailgun Setup (Outbound Sending)

Mailgun sends transactional emails (invitations, password resets, notifications) as `noreply@yourdomain.com`.

### Configuration

1. Sign up at [mailgun.com](https://www.mailgun.com)
2. Go to **Sending** -> **Domains** -> **Add New Domain**
3. Enter your domain (e.g. `yourdomain.com`)
4. Mailgun provides the DNS records below -- add them to your DNS
5. Click **Verify DNS Settings** in the Mailgun dashboard once records propagate

### Required DNS Records

| Type        | Name                            | Value                                                      |
| ----------- | ------------------------------- | ---------------------------------------------------------- |
| TXT (SPF)   | yourdomain.com                  | `v=spf1 include:mailgun.org include:spf.improvmx.com ~all` |
| TXT (DKIM)  | smtp.\_domainkey.yourdomain.com | _(provided by Mailgun dashboard)_                          |
| CNAME       | email.yourdomain.com            | mailgun.org                                                |
| TXT (DMARC) | \_dmarc.yourdomain.com          | `v=DMARC1; p=quarantine;`                                  |

> **Note:** The DKIM value is unique to your account. Copy it from the Mailgun dashboard after adding the domain.

### Sandbox Domain

Mailgun provides a sandbox domain (e.g. `sandboxXXX.mailgun.org`) for development and testing. No DNS setup is needed for the sandbox -- use it for local development by setting `MAILGUN_DOMAIN` to the sandbox value.

## Combined DNS Configuration

All records needed for both services on a single domain:

| Type  | Name                            | Value                                                      | Priority |
| ----- | ------------------------------- | ---------------------------------------------------------- | -------- |
| MX    | yourdomain.com                  | mx1.improvmx.com                                           | 10       |
| MX    | yourdomain.com                  | mx2.improvmx.com                                           | 20       |
| TXT   | yourdomain.com                  | `v=spf1 include:mailgun.org include:spf.improvmx.com ~all` | --       |
| TXT   | smtp.\_domainkey.yourdomain.com | _(DKIM value from Mailgun)_                                | --       |
| CNAME | email.yourdomain.com            | mailgun.org                                                | --       |
| TXT   | \_dmarc.yourdomain.com          | `v=DMARC1; p=quarantine;`                                  | --       |

The MX records route inbound mail to ImprovMX. The TXT, CNAME, and DKIM records authenticate outbound mail through Mailgun. The combined SPF record (`include:mailgun.org include:spf.improvmx.com`) covers both services in a single TXT entry.

## Environment Variables

```env
MAILGUN_API_KEY=key-xxxxx
MAILGUN_DOMAIN=yourdomain.com
```

- **Server-only** -- do not use the `NEXT_PUBLIC_` prefix. These values must never be exposed to the browser.
- Create a domain-scoped API key in the Mailgun dashboard under **Settings** -> **API Keys** -> **Add sending key** scoped to your domain.

## Vercel DNS Configuration

Since the domain is purchased through Vercel, add all DNS records in the Vercel dashboard:

1. Go to **Vercel Dashboard** -> **Domains** -> select your domain
2. Open the **DNS Records** tab
3. Add each record from the combined table above

Vercel-specific notes:

- For the `Name` field, Vercel auto-appends your domain -- enter only the subdomain prefix (e.g. `smtp._domainkey`, `_dmarc`, `email`). For root-level records (MX, SPF TXT), leave the name field blank or use `@`.
- DNS propagation typically completes within minutes for Vercel-managed domains.
- After adding records, verify in both the Mailgun dashboard (outbound) and ImprovMX dashboard (inbound) that DNS is detected correctly.
