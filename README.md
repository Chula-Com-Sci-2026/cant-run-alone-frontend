# Can't Run Alone frontend

Responsive React prototype for the core Running Buddy flows. It defaults to a typed in-browser mock gateway so the design can be reviewed before backend integration.

## Run locally

```bash
npm install
npm run dev
```

Open the application at the Vite URL. The reviewable component and state inventory is at `/design-system`; login is at `/login`. Prefilled demo credentials are accepted by the mock gateway.

The “Who’s nearby?” action at `/nearby` asks for browser location permission, draws a private current-position marker and 1 km radius, and calculates the distance to each event pin. If location access is unavailable, the screen offers a safe demo position near Lumphini Park. The create-run screen includes a clickable, zoomable meeting-point map.

Copy `.env.example` to `.env` only when local overrides are needed. Keep `VITE_USE_MOCK_API=true` until the BFF implements the proposed OpenAPI contract. With mocks disabled, all requests use `VITE_API_BASE_URL`; the browser never addresses internal services directly.

## Commands

- `npm run build` — type-check and make a production build
- `npm test` — run component and flow tests
- `npm run dev` — start the development server

The map and its CSS load only when the run map view is opened. English is the initial locale; the profile and sidebar controls switch to Thai and save the choice locally.


## Deliverable 4 local services

The application now defaults to the real gateway at `http://localhost:8088/api/v1`; set `VITE_USE_MOCK_API=true` only for explicit prototype work. Start the sibling local-integration stack and seed its demo data as documented in `../local-integration/README.md`, then run `npm run dev` and open `/login`. Two seeded accounts are `ray@example.com` and `mali@example.com`, password `runner123`.

Registration uses the Identity API and an explicitly labeled console OTP adapter. Profile edits, discovery, buddy requests, live forecast previews and run creation/joining use the gateway. Activity contains incoming request responses, notifications, attendance, ratings and running history. A prepared past run allows demonstrating attendance without waiting for a new run to finish. The second participant confirmation completes the run; only confirmed participants can rate or save records.

Focused UI tests cover registration/OTP, profile saving, incoming request acceptance and attendance errors. Existing prototype tests explicitly enable mock mode; full browser verification uses real backends. `screenshots/delivery4/` contains captured UI evidence. Current API tests are in `../local-integration/scripts/check_flows.py`.
