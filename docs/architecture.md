# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability          | Method and path                               | Expected behavior                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Activity tracking   | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams               | `GET /api/teams`, `POST /api/teams`           | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`.                                                                                                                                                                                                                                |
| Leaderboard         | `GET /api/leaderboard`                        | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`.                                                                                                                                                                                                                                     |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail`    | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`).                                                                                     |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: React Router owns navigation and page composition; React components render API data and accessible loading, empty, and error states through the shared client.
- Logic tier decision: Express routes expose `/api/*` contracts while service functions validate input, enforce cross-document rules, and compute derived results.
- Data tier decision: Mongoose schemas own field validation and references; services use the shared models and database configuration rather than embedding persistence in routes or components.
- Activity tracking approach: Validate existing user/team ObjectIds, require positive minutes, compute points from minutes, and assign the occurrence time in the service.
- Team management approach: Require a name and mascot, validate member references, and keep team membership represented by ObjectId references.
- Leaderboard approach: Sum activity points per team, include teams with no activity, sort descending, and assign 1-based ranks.
- Workout suggestions approach: Match a user's fitness goal first, fall back to their recent activity pattern, and return a human-readable reason; unknown users receive a deliberate 404.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` (schema validation and idempotent seed preservation)
- API command: `npm run test:api --prefix octofit-tracker/backend` (HTTP status, validation, references, and computed responses)
- Frontend command: `npm test --prefix octofit-tracker/frontend` (routes, API rendering, and accessible request states)
- Backend build command: `npm run build --prefix octofit-tracker/backend` (TypeScript contracts)
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` (TypeScript and Vite bundle)
