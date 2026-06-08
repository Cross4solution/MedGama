# MedaGama — Security Policy

We take the security of MedaGama and the personal/health data it processes
very seriously. This document explains how to report a vulnerability and
what to expect from us.

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security findings.

- Email: **security@medagama.com** (also CC `dpo@medagama.com` for data-protection issues)
- Encrypt sensitive reports with our PGP key on request.
- Include: a clear description, reproduction steps, affected version/commit,
  and any proof-of-concept code.

We will acknowledge your report within **3 business days** and provide an
initial assessment within **10 business days**.

## Responsible Disclosure

- We follow a **90-day coordinated disclosure** window from the date of
  acknowledgement to public disclosure (or patch release, whichever is sooner).
- Researchers acting in good faith — no privacy violations, no service
  disruption, no data exfiltration beyond what is necessary to demonstrate
  the issue — will not be subject to legal action.
- We are happy to credit reporters in the release notes when a fix ships,
  unless you prefer to remain anonymous.

## Out of Scope

- Findings from automated scanners without a working proof-of-concept.
- Social engineering of MedaGama staff.
- Denial-of-service via volumetric traffic.
- Issues in third-party services (TiDB Cloud, Render, Vercel, Google Maps)
  — please report those directly to the provider.

## Data Breach Notifications

If a confirmed breach involves personal data, we follow the playbook in
[`docs/SECURITY_INCIDENT_RUNBOOK.md`](docs/SECURITY_INCIDENT_RUNBOOK.md),
including notification of the KVK Kurumu / lead supervisory authority within
72 hours, in line with KVKK Art. 12 and GDPR Art. 33-34.
