# VoteDirect — clickable demo

A prototype voting platform for political party members and independents. It is
a **demo for showing partners and party contacts how the system works** — there
is **no real backend, login or SMS**. Everything runs in the browser with
seeded mock data and persists to `localStorage`, so the demo survives a refresh.

> All parties and people are invented placeholders. No real party names, logos
> or real politicians are used. Colours deliberately avoid those tied to any
> Kerala party.

## Tech

- **Vite + React + TypeScript**
- **Tailwind CSS** (design tokens in `tailwind.config.js`)
- **React Router** for pages
- **Zustand** (with `persist` middleware) as the single client-side store
- **Vitest** for unit tests
- Fonts: Fraunces (headings) + IBM Plex Sans (body) via Google Fonts

## Run

```bash
npm install
npm run dev      # start the dev server
npm test         # run the rules unit tests
npm run build    # type-check + production build into dist/
npm run preview  # preview the production build
```

## Deploy (static site)

The app is a static SPA. Both configs include the SPA fallback so deep links
like `/app/poll/:id` resolve.

- **Vercel:** import the repo; `vercel.json` handles rewrites. Build command
  `npm run build`, output `dist`.
- **Netlify:** `netlify.toml` (and `public/_redirects`) are included. Build
  command `npm run build`, publish directory `dist`.

## Project structure

```
src/
  components/     # Layout, DemoPanel, VoteBar, SegmentTabs, TrendChart, …
  pages/          # Landing, Signup, Ballot, PollPage, CandidateProfile,
                  # BecomeCandidate, Approvals, Profile, AdminPanel, CoalitionView
  store/useStore.ts   # Zustand store: state + all mutations, persisted
  lib/rules.ts        # PURE eligibility / cooldown / results logic
  lib/rules.test.ts   # Vitest coverage for every voting rule
  lib/selectors.ts    # read-only derived helpers over the data
  data/types.ts       # data model (users, parties, fronts, polls, votes, …)
  data/seed.ts        # deterministic seed data
  i18n/en.ts          # ALL UI strings (add ml.ts for Malayalam later)
```

### Adding a Malayalam translation

Every user-facing string lives in `src/i18n/en.ts`. To translate, copy it to
`ml.ts` with the same shape and switch the export in `src/i18n/index.ts`
(or add a language selector).

## Data model

Kept close to what a real backend would use: `users`, `parties`, `fronts`,
`constituencies`, `roles`, `polls`, `candidacies`, `votes`, `approvals`,
`auditLog`, and 12-week `trends`. See `src/data/types.ts`.

## Voting rules (all enforced in `lib/rules.ts`)

- Chief Minister and Leader of Opposition polls are open to **everyone**,
  independents included.
- Each coalition (Front 1/2/3) has its own CM candidate poll — **only members
  of that front's parties** may vote.
- Party roles (constituency candidate, internal posts) can be voted on **only by
  members of that party**.
- Constituency candidate polls are limited to users whose **selected
  constituency matches**.
- Candidates for a party's roles must be **members of that party** (verification
  not required to receive votes). Every candidacy needs a pitch to publish.
- Current office holders get a separate **Approve / Disapprove** vote.
- **One vote per user per poll**; votes can be changed any time (results double
  as a live approval rating).
- **Changing party** deletes all the user's votes and blocks the new party's
  polls for **90 days**.
- **Rejection** by a party admin makes the user independent with a **90-day**
  block on rejoining, unless the admin re-adds them.
- A segment's result is **hidden until it has ≥ 20 votes**.
- Admins **never** see how an individual voted — only aggregates.

Blocked votes always explain *why* in the UI.

## Demo personas (Demo panel, bottom-right, on every page)

| Persona | What it shows |
| --- | --- |
| **Independent** | Can vote in CM / LoP only; every party & front poll is view-only with a reason. |
| **Party A — self-declared** | Votes in Party A + Front 1 polls; not yet verified (so counts in the "members" segment but not "verified"). |
| **Party A — verified** | Same as above, but also counts in the "verified members" segment. |
| **Party B — verified** | Party B member; can vote in Front 1 (Party B is in Front 1) but not Party A's internal polls. |
| **Party A — admin** | Unlocks the Party Admin panel: verification queue, members, positions, aggregate results, coalition appointment, audit log, billing. |
| **Front 1 — coalition admin** | Unlocks the Coalition Admin view for Front 1's CM candidate poll. |

The Demo panel also has:

- **Advance 90 days** — moves the demo clock forward so cooldowns expire.
- **Simulate live activity** — a toggle that adds random valid votes every few
  seconds so results visibly move (watch a poll or approval page).
- **Reset demo data** — restores the seeded state.

## A note on the seed data

Seed volumes are tuned so **most** segments cross the 20-vote threshold while
**some** small segments (e.g. thin constituency polls, Party E's verified
segment) stay under, so the "Hidden until 20 votes" state is visible in the demo.
