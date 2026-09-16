# Security Policy

QUOTELY is an open-source project. Security reports are appreciated.

## Reporting a Vulnerability

Please do not publish sensitive security vulnerabilities in a public GitHub issue.

Instead, contact:

**Abbas Bhojani**  
https://abbasbhojani.com

When reporting a vulnerability, include:

- A description of the issue
- Steps to reproduce it
- The affected part of QUOTELY
- Potential impact
- Any suggested fix, if available

Please do not include real Visitor session tokens, recovery codes, secrets, or other private credentials in reports.

## Secrets

QUOTELY keeps backend secrets outside the source code using Cloudflare Worker secrets.

Contributors must never commit:

- Worker secrets
- `.dev.vars`
- `.env` files
- Visitor session tokens
- Visitor recovery codes
- Private credentials

If a secret is accidentally committed, it should be considered compromised and replaced.