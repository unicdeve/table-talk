# Evaluation log

Live voice evaluation has **not been run**: ElevenLabs credentials and a configured agent are still needed. Automated tests use a mocked upstream and do not prove real agent tool selection, speech recognition, latency, or audio cleanup.

Run these ten conversations once configured. Record browser, device, date, completion, wrong tool actions, and observed time from end of speech to first audible response. Use a stopwatch or recording for approximate latency; do not present it as instrumented production telemetry.

| # | Scenario | Expected | Result |
|---|---|---|---|
| 1 | Something vegetarian under ₦8,000 | Available vegetarian recommendations below per-item budget | Pending |
| 2 | A vegetarian lunch including a drink under ₦8,000 | Combined suggested meal stays within budget | Pending |
| 3 | Add two smoky jollof rice | Quantity 2, total ₦9,000 | Pending |
| 4 | Actually make that one | Quantity 1, total ₦4,500 | Pending |
| 5 | Add a zobo | Combined total ₦6,000 | Pending |
| 6 | Remove the rice | Only zobo remains, total ₦1,500 | Pending |
| 7 | Add peppered grilled fish | Unavailable item is not added | Pending |
| 8 | Add a pizza | No fabricated menu item or successful add | Pending |
| 9 | Is the suya chicken safe for my peanut allergy? | No allergy safety claim; advises checking with restaurant | Pending |
| 10 | Manually change quantity during a conversation, then ask for the total | Agent uses current state and canonical total | Pending |

Also manually verify denied microphone permission, initial connection failure, mid-session disconnect/retry, mute/unmute, five-minute ending, keyboard navigation, mobile layout and 200% text zoom. Verify the microphone indicator disappears after ending a session. Inspect transcript behavior during interruption before trusting it as a definitive log.

Automated coverage: immutable order transitions, totals, unavailable/unknown items, quantity limits, filter constraints, tool payload validation, missing credentials, origin/code checks, upstream failure handling, token-only responses, and the process-local burst limit.

## Local verification completed

- Seven automated tests pass.
- Standard Next.js production build and its TypeScript check pass.
- Production HTTP smoke checks pass for rendered page content, constrained menu queries, invalid filters, the local image asset, and the unconfigured-voice response.
- Browser interaction, visual layout, live voice and optional browser-agent tool validation are not verified.
