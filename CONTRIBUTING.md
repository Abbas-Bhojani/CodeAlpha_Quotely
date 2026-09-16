
### 4. Replace `CONTRIBUTING.md`

```md
# Contributing to QUOTELY

Thank you for considering contributing to QUOTELY.

QUOTELY is intentionally kept understandable and relatively small. Contributions should improve the project without unnecessarily complicating it.

## Ways to Contribute

You can contribute by:

- Reporting bugs
- Fixing bugs
- Improving accessibility
- Improving responsiveness
- Improving documentation
- Improving existing code
- Suggesting carefully scoped features
- Suggesting quote datasets, APIs, or other legitimate quote sources

## Before Making a Change

For significant changes, open an issue first and explain:

1. What problem you found
2. What you propose changing
3. Why the change benefits QUOTELY

Small fixes can be submitted directly through a pull request.

## Development Principles

Please preserve these principles:

- Keep the frontend framework-free
- Prefer HTML, CSS, and vanilla JavaScript
- Keep private credentials on the backend
- Do not expose secrets in browser code
- Keep the interface responsive
- Preserve QUOTELY's editorial visual direction
- Avoid unnecessary dependencies
- Avoid feature creep
- Write understandable code
- Add comments where they help someone learning the project understand why something exists

## Quote Contributions

Do not submit a quote simply because it appears on another quote website.

When suggesting an external source, provide:

- Source or API name
- Website
- Documentation
- License or usage terms
- Whether commercial use is allowed
- Whether storing/caching results is allowed
- Attribution requirements
- Rate limits
- Whether an API key is required

Quote content rights and software/API code licenses are not necessarily the same thing.

QUOTELY will only integrate sources after their terms have been reviewed.

## Security

Never commit:

- API keys
- Worker secrets
- `.dev.vars`
- `.env` files
- Visitor session tokens
- Recovery codes
- Private credentials

Security vulnerabilities should follow the process in `SECURITY.md`.

## Pull Requests

Keep pull requests focused.

A good pull request should:

- Explain what changed
- Explain why
- Avoid unrelated modifications
- Preserve existing behavior unless intentionally changing it
- Be tested before submission

Thank you for helping improve QUOTELY.