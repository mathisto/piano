# App privacy answers

Use these answers for the iPad app. They describe build 710 and the current Cloudflare delivery path.

## Policy

- Privacy policy URL: <https://pagetohand.com/privacy/>
- Privacy choices URL: leave blank. The app has no account or server-side user record to inspect or delete.
- Tracking: no.
- Data linked to the user: no.

## Data collected

Answer **Yes, we collect data from this app**. The app keeps scores, MIDI events, practice history and settings on-device, but requests for the app shell and optional score catalogue pass through Cloudflare. Its sampled HTTP analytics retain network metadata for at least 31 days.

| App Store data type | Purposes | Linked | Tracking | Why |
|---|---|---:|---:|---|
| Coarse Location | App Functionality; Analytics | No | No | Cloudflare can derive an approximate region from the request IP address. |
| Product Interaction | App Functionality; Analytics | No | No | Requested app and catalogue URLs reveal which product resources were used. |
| Other Diagnostic Data | App Functionality; Analytics | No | No | Sampled request metadata includes IP address, app/browser information, URL and timing. |

Do not select identifiers, contact information, purchases, user content, crash data or performance data for this build. No advertising SDK, analytics SDK, account, entitlement service or origin access log is present.

An email the user voluntarily sends to Support is optional customer-service data, is unrelated to the app's primary purpose, and is used only to answer that request. Apple permits that narrow case to be omitted from the label; the public privacy policy still discloses it.

## Privacy manifest cross-check

`ios/App/App/PrivacyInfo.xcprivacy` declares no tracking or SDK-collected data and declares System Boot Time API reason `35F9.1`. That manifest covers code in the bundle. The App Store answers above separately disclose delivery-network processing outside the bundle.

Recheck these answers if hosting, logging, crash reporting, accounts or third-party SDKs change.
