# AGENTS.md

## Repository identity

- Recommended public repository name: `job-analytics-frontend`
- Recommended product description: Next.js frontend for job analytics dashboards, AI chat, CV matching, and search experiences.
- This repository is the presentation layer for the JobLab user experience on `job.oploy.eu`.

## Agent rules

1. Ground all documentation and code changes in the actual repository.
2. Do not invent backend behavior that is not implemented in the API routes or UI components.
3. Treat this project as a frontend dashboard application, not as the scraping pipeline or agent backend itself.
4. Keep terminology clear: dashboard, analytics, chat, CV match, search, Supabase, Mantine, Apache ECharts.
5. Never commit real secrets or production endpoints with embedded credentials.

## Current implementation facts

- Framework: Next.js App Router with TypeScript.
- UI layer uses Mantine.
- Visualization layer uses Apache ECharts.
- Data layer connects to Supabase.
- Frontend also exposes API proxy routes for AI chat, CV matching, and related backend interactions.
- The dashboard includes charts, KPI cards, filters, job lookup, onboarding, and AI-assisted workflows.

## Documentation expectations

- Keep the README focused on user-facing capabilities and frontend architecture.
- Distinguish clearly between frontend responsibilities and backend responsibilities.
- Keep deployment details secondary to product usage and structure.
- Use concise diagrams and explain what each one is for.

## Safe cleanup policy

Safe to remove for public release:

- local `.env` files
- generated TypeScript build info
- temporary notes or internal-only scratch artifacts

Use caution around:

- API route behavior
- SEO metadata
- Supabase client configuration
- dashboard filters and state management
