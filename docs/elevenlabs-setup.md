# ElevenLabs setup

1. Create an ElevenAgents agent in your ElevenLabs account. Choose an English voice and a conversational model that supports tools.
2. Paste `docs/agent-prompt.md` into the system prompt.
3. First message: “Hi, welcome to Lagos Kitchen. What are you craving today?”
4. Enable agent authentication. Restrict allowed origins to your local app and, later, its actual deployment domain. Configure the agent's maximum conversation duration to five minutes; the app's timer is only a client convenience.
5. Add the three **client tools** described below. Enable **Wait for response** on each. These run in the React app, not as webhook tools.
6. Ensure the client events include user transcription and agent response so the transcript is populated.
7. Copy `.env.example` to `.env.local`. Set `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID`. Keep keys server-side. Never prefix them with `NEXT_PUBLIC_`.
8. Optionally set `DEMO_ACCESS_CODE` for local development; it is required by this app when running with `NODE_ENV=production`. Enter that same code through the voice panel's access-code field. Do not put it in the repository.
9. If running behind a reverse proxy, set `APP_ORIGIN` to the exact browser origin (scheme, host and port, without a trailing slash). Otherwise the endpoint uses the direct Host header with the request scheme.
10. Restart the server, open the app on localhost, and click “Talk to the assistant”. Allow microphone access.

## Client tools

Names and parameter spelling are case-sensitive. `docs/agent-tools.json` holds the full ElevenLabs client-tool config for each tool, with Wait for response (`expects_response`) on. It uses the API format, so it can't be pasted into the dashboard's JSON editor, which expects `parameters` as an array. Create each tool with `POST /v1/convai/tools` (body `{ tool_config, response_mocks }`), then add the returned IDs to the agent's `conversation_config.agent.prompt.tool_ids`. ElevenLabs tool parameters don't support numeric or length limits, so those are stated in the descriptions and enforced by the app.

### search_menu

Description: Search the canonical restaurant menu before recommending or adding dishes. Return prices, item IDs, availability, and dietary tags. All supplied constraints are combined.

All parameters are optional:

- `query`: string, a short name or keyword. Omit for broad recommendations.
- `vegetarian`: boolean. Use true for vegetarian requests.
- `maxPrice`: number, maximum price per item in NGN, not the whole order budget.
- `category`: string enum: `Mains`, `Sides`, `Drinks`.

Response: `{ success: true, result: { items, currency, allergenNotice } }`, or `{ success: false, error }`.

### highlight_items

Description: Highlight the recommended menu items on screen. Use IDs returned by search_menu. Does not change the draft order. Send an empty array to clear highlights.

Required parameter: `itemIds`, array of strings, at most nine entries.

Response: `{ success: true }`, or `{ success: false, error }`.

### update_draft_order

Description: Update the user's draft order after an explicit request. Wait for the result before confirming. No real order or payment is created.

Required parameters:

- `itemId`: string, an ID returned by search_menu.
- `action`: string enum `add`, `set`, `remove`.
- `quantity`: integer from 0 to 20. For add: amount to add. For set: desired final amount. For remove: use zero.

Response: `{ success: true, items, total, count, currency }`, or `{ success: false, error }`.

## Troubleshooting

- 503: missing server credentials, or missing production demo access code.
- 401: wrong demo access code.
- 502: verify the API key, agent ID, permissions and upstream availability. Raw upstream errors and credentials are not returned to the browser.
- 429: wait a minute before creating another session.
- Tool not called: check the name, parameter types, descriptions, and Wait for response setting.
- Microphone denied: change browser site permissions and retry. Voice requires localhost or HTTPS.

The server's five-requests-per-minute guard is global to one process. It is not a distributed rate limiter. Before public deployment, add a shared limiter, set account/agent usage limits, and keep the demo access gate enabled. A client-side five-minute timer does not constrain a caller using a token outside this app.

Official references:

- https://elevenlabs.io/docs/eleven-agents/libraries/react
- https://elevenlabs.io/docs/eleven-agents/customization/tools/client-tools
- https://elevenlabs.io/docs/api-reference/conversations/get-webrtc-token
