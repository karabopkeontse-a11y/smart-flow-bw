# Smart Flow BW 💧

**Water intelligence with Thothi AI.**

Smart Flow BW helps households understand water use, spot unusual flow, investigate possible leaks, and see where a bill may be heading before the official bill arrives.

## Deadline Sprint — zero-cost testing

The Android APK now contains a **fully offline demo/simulation mode** so the product can be tested without a physical meter, paid API, or live sensor connection.

Open the APK and test these scenarios:

- 💧 **Normal day** — calm household pattern
- 👀 **Overnight leak** — continuous low flow that triggers Thothi concern
- 🚨 **High flow** — possible burst/open tap scenario
- 🌱 **Improving** — falling usage and positive Thothi reaction

The demo includes:

- Water Command Center
- **Before Your Bill** forecast experience
- Smart Flow bill estimate disclaimer
- Proactive Thothi insight
- Living water-droplet character
- Thothi chat
- Alert timeline
- Saving tasks
- Scenario switching
- Offline operation

### Important

Demo numbers are illustrative. They are **not official WUC readings, tariffs, bills, or leak determinations**.

## Android app

Native Android source is in `android`. Every push to `main` runs the **Build Smart Flow BW Android APK** workflow. The workflow first runs an offline demo smoke test, then builds the debug APK and uploads a downloadable package as an Actions artifact.

For a Play Store release, sign a release App Bundle with a private signing key.

## Product position

Smart Flow is not intended to replace WUC customer self-service.

> **WUC tells you what you owe. Smart Flow helps you understand why — and what to do before it hurts.**

**Your water finally has something to say.**
