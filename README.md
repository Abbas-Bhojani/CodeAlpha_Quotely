# QUOTELY

> Thoughts worth keeping.

QUOTELY is an open-source quote discovery, saving, and sharing experience built around a simple idea: finding a thought worth remembering should feel intentional.

The project combines a minimal editorial frontend with a serverless backend, persistent anonymous visitor identities, saved collections, temporary quote history, recovery, and purpose-built quote sharing.

## Live Website

https://quotely.abbasbhojani.com

## What QUOTELY Does

QUOTELY allows visitors to:

- Discover quotes across multiple categories
- Generate random thoughts from the QUOTELY catalogue
- Keep a temporary history of recently generated thoughts
- Save thoughts permanently to their collection
- Copy quotes
- Generate shareable quote images
- Recover their collection on another device
- Use the application without creating a traditional account

## Categories

QUOTELY currently includes:

- Wisdom
- Life
- Inspirational
- Success
- Courage
- Happiness
- Art

Random discovery can select from all categories.

## Quote Catalogue

QUOTELY uses its own curated quote catalogue stored in Cloudflare D1.

The initial public release contains more than 300 thoughts across the available categories.

External quote APIs are intentionally not required for normal quote generation. This keeps generation fast and avoids exposing API credentials or making the core experience dependent on a third-party quote service.

Future contributors may propose additional quote sources, datasets, or APIs through GitHub issues. Any proposed source must be reviewed for licensing, redistribution rights, attribution requirements, storage permissions, reliability, and other relevant terms before integration.

## Technology

### Frontend

- HTML
- CSS
- Vanilla JavaScript

No frontend framework is required.

### Backend

- Cloudflare Workers
- Cloudflare D1

The Worker provides the API used by the frontend and keeps database operations and security-sensitive logic away from the browser.

## Visitor Identity

QUOTELY intentionally avoids traditional username/password accounts.

A visitor receives a sequential six-digit Visitor ID and a recovery credential.

The browser stores the active visitor session locally, while persistent information is associated with the visitor in D1.

This allows saved thoughts to survive beyond the local browser and makes cross-device recovery possible without introducing a full account system.

## Recent Thoughts

Recently generated thoughts are temporary.

Each generated thought has its own creation time and expires from Recent Thoughts after 24 hours.

Saving a thought moves the important part of the experience from temporary history into persistent storage.

## Saved Thoughts

Saved Thoughts are stored through the QUOTELY backend in Cloudflare D1.

Visitors can:

- Save a thought
- View their collection
- Copy it
- Share it
- Remove it

## Sharing

QUOTELY generates a purpose-built 1080 x 1350 quote image rather than taking a screenshot of the interface.

The generated image contains:

- QUOTELY branding
- Category
- Quote
- Author
- Generator attribution

## Project Structure

```text
CodeAlpha_Quotely/
├── about/
├── assets/
├── js/
├── public/
├── saved/
├── worker/
├── index.html
└── style.css
```

The frontend is intentionally built without a JavaScript framework so that its behavior remains approachable to people learning web development.

The backend lives inside `worker/`.

## Local Development

Install the Worker dependencies:

```bash
cd worker
npm install
```

Start the Cloudflare Worker development environment:

```bash
npm run dev
```

The project requires a configured Cloudflare D1 database for backend functionality.

Do not commit Cloudflare secrets or local environment files.

## Security

Backend credentials and cryptographic secrets must never be placed in browser JavaScript or committed to Git.

See [SECURITY.md](SECURITY.md) for security reporting information.

## Contributing

Contributions are welcome.

You can:

- Report bugs
- Suggest improvements
- Improve documentation
- Propose quote sources
- Submit code changes

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before contributing.

## License

The QUOTELY software is released under the MIT License.

See [LICENSE](LICENSE).

Quote text and third-party content may have rights separate from the software license. Contributors are responsible for ensuring that submitted content can legally be stored and redistributed by the project.

## Creator

QUOTELY was created by **Abbas Bhojani**.

Website: https://abbasbhojani.com  
GitHub: https://github.com/Abbas-Bhojani  
LinkedIn: https://www.linkedin.com/in/abbasbhojani/