# Device-check preflight

**TL;DR (7 Nov 2026):** real-device review now begins by proving the current TestFlight build is installed. The connected iPad still reported the old Piano Forte build 496 even though Apple had emailed that Page to Hand builds 710 and 712 were available.

The checklist requires TestFlight's **Installed** state and the **Page to Hand** Home Screen label before behavior is credited. This closes the gap between upload/readiness evidence and the binary actually under test; no app, deployment or TestFlight build changed.

Verified with `devicectl`: bundle `io.mattkelly.piano`, installed name `Piano Forte`, build 496. TestFlight build 712 is separately confirmed ready to install. VoiceOver was off when queried, so its behavioral checks remain open.
