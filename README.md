# Machine Interfacing App

[![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20Windows%20%7C%20macOS-blue)](#supported-platforms)
[![Runtime](https://img.shields.io/badge/runtime-Electron-47848F)](#technology-stack)
[![Frontend](https://img.shields.io/badge/frontend-Angular-DD0031)](#technology-stack)
[![Database](https://img.shields.io/badge/database-SQLite-003B57)](#data-storage)
[![Status](https://img.shields.io/badge/status-release--candidate-orange)](#release-readiness)

Machine Interfacing App is a cross-platform desktop platform for connecting laboratory analyzers to laboratory information systems. It supports analyzer connectivity, machine runtime monitoring, message parsing and normalization, approval workflows, LIS test-order profile validation, OpenMRS LIS payload generation, outbound delivery queueing, audit tracking, deployment readiness checks, and packaged distribution for Linux, Windows, and macOS.

> This repository is intended for controlled laboratory, LIS, and health information system deployments. Review security, privacy, data protection, and local regulatory requirements before production rollout.

---

## Table of contents

- [Overview](#overview)
- [Key capabilities](#key-capabilities)
- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Supported platforms](#supported-platforms)
- [Repository structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Development workflow](#development-workflow)
- [Configuration](#configuration)
- [Database and storage](#database-and-storage)
- [Machine runtime and simulation](#machine-runtime-and-simulation)
- [LIS profiles and OpenMRS delivery](#lis-profiles-and-openmrs-delivery)
- [Audit, security, and readiness](#audit-security-and-readiness)
- [Packaging and distribution](#packaging-and-distribution)
- [Auto-update strategy](#auto-update-strategy)
- [Release checklist](#release-checklist)
- [Troubleshooting](#troubleshooting)
- [Security considerations](#security-considerations)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Machine Interfacing App provides an operational bridge between laboratory analyzers and downstream health information systems such as OpenMRS LIS. It is designed for laboratories that need a traceable, auditable, and configurable way to receive analyzer messages, normalize results, validate LIS metadata, approve results, route them to the correct target system, and monitor delivery status.

The platform is especially suited for workflows involving:

- ASTM, HL7, raw TCP, serial, file watcher, FTP, and SFTP analyzer integrations.
- Machine runtime monitoring and traffic diagnostics.
- Analyzer simulation and use-case testing.
- LIS test-order profile validation.
- OpenMRS LIS payload preview, rebuild, and delivery.
- Approval and routing governance.
- Audit trail, deployment readiness, and backup validation.

---

## Key capabilities

### Machine connectivity

- Register analyzer machines with protocol, connection type, lab, code, model, version, and manufacturer metadata.
- Start, stop, and restart live machine runtime sessions.
- Monitor machine status, last traffic, active runtime, simulation state, and operational attention points.
- Inspect raw traffic logs, parsed messages, and normalized result records.
- Replay selected traffic for diagnostic validation.

### Parser and normalizer pipeline

- Parse analyzer messages into protocol-aware parsed records.
- Normalize analyzer output into canonical result records.
- Preserve traceability between machine session, traffic log, parsed message, normalized result, workflow result, and outbound queue item.
- Support protocol-specific normalization through registry-driven normalizers.

### Simulation workspace

- Run analyzer simulation sessions.
- Manage simulation use cases.
- Validate parser and normalizer behavior before connecting a real instrument.
- Maintain simulation run history for traceability.

### LIS profile-aware delivery

- Configure one LIS test-order profile per LIS target and LIS test order.
- Discover test orders and parameters from representative OpenMRS LIS sample metadata.
- Validate required analyzer codes, order concept UUIDs, parameter concept UUIDs, allocation UUIDs, value types, and readiness.
- Preview OpenMRS LIS payloads before delivery.
- Rebuild payloads from latest profiles and mappings.

### Mapping and routing

- Manage mapping rules for analyzer codes, values, OpenMRS concept UUIDs, coded answers, instruments, users, and test allocations.
- Route approved results to target systems using routing rules.
- Preserve approval-policy fallback routing when no explicit routing rule matches.

### Outbound delivery

- Queue approved results for delivery.
- Preview payloads.
- Rebuild payloads.
- Retry, requeue, and send queue items.
- Track blocked, pending, sending, failed, and delivered items.
- Inspect delivery audit trail and queue context.

### Audit and readiness

- Record sensitive operational events in an audit trail.
- Redact secrets, tokens, passwords, API keys, Authorization headers, cookies, and session-like values.
- Run deployment readiness checks.
- Inspect app/build diagnostics, database path, backup path, logs path, storage permissions, packaging readiness, and release checklist.
- Create SQLite database backups from the UI.

---

## Architecture

The application follows a desktop architecture based on Electron, Angular, and SQLite.

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Angular Renderer                         │
│  UI pages, dialogs, dashboards, readiness, audit, queue, LIS     │
└───────────────────────────────┬─────────────────────────────────┘
                                │ Preload API
┌───────────────────────────────▼─────────────────────────────────┐
│                         Electron Preload                        │
│       Safe API exposure from renderer to Electron main           │
└───────────────────────────────┬─────────────────────────────────┘
                                │ IPC channels
┌───────────────────────────────▼─────────────────────────────────┐
│                         Electron Main                           │
│  IPC handlers, services, machine runtime, simulation, delivery   │
└───────────────┬──────────────────────┬──────────────────────────┘
                │                      │
┌───────────────▼──────────────┐ ┌─────▼──────────────────────────┐
│            SQLite            │ │      External Systems           │
│  config, logs, audit, queue   │ │  analyzers, OpenMRS LIS, APIs   │
└──────────────────────────────┘ └────────────────────────────────┘
```

### Main layers

| Layer | Responsibility |
| --- | --- |
| Angular renderer | User interface, dashboards, forms, dialogs, readiness views |
| Electron preload | Safe renderer-to-main API contract |
| Electron main | IPC, services, runtime managers, database access |
| SQLite | Local storage, audit trail, machine configuration, queue, mappings |
| Runtime managers | Live connections, simulations, traffic capture, replay diagnostics |
| Delivery services | Payload building, routing, outbound queue, OpenMRS LIS delivery |

---

## Technology stack

| Area | Technology |
| --- | --- |
| Desktop runtime | Electron |
| Frontend | Angular, Angular Material |
| Backend runtime | Node.js inside Electron main process |
| Database | SQLite via `better-sqlite3` |
| Native connectivity | `serialport`, TCP/MLLP/File Watcher/FTP/SFTP support |
| Packaging | Electron Builder |
| Auto-update | electron-updater |
| Build tooling | Angular CLI, TypeScript, esbuild |
| UI style | SCSS |

---

## Supported platforms

| Platform | Package target | Recommended build host |
| --- | --- | --- |
| Linux | AppImage, `.deb` | Linux |
| Windows | NSIS `.exe` installer | Windows |
| macOS | `.dmg` and `.zip` | macOS |

Because the app uses native dependencies such as `better-sqlite3` and `serialport`, build packages on the same operating system family where possible.

---

## Repository structure

```text
machine-interfacing-app/
├── electron/
│   ├── src/
│   │   ├── main/
│   │   │   ├── db/
│   │   │   ├── ipc/
│   │   │   ├── runtime/
│   │   │   └── services/
│   │   ├── preload/
│   │   └── shared/
│   ├── build-preload.mjs
│   └── tsconfig.json
├── src/
│   ├── app/
│   │   ├── core/
│   │   ├── features/
│   │   └── layout/
│   ├── assets/
│   └── styles.scss
├── build/
│   └── icons/
├── release/
├── package.json
├── angular.json
└── README.md
```

---

## Prerequisites

Install the following before development or packaging:

- Node.js compatible with the project dependencies.
- npm.
- Native build tools required by `better-sqlite3` and `serialport`.
- Git.
- Platform-specific packaging tools:
  - Linux: standard build tools and package utilities.
  - Windows: Windows environment for NSIS build.
  - macOS: macOS environment, Apple Developer signing certificate for production distribution.

### Linux development packages

Depending on your distribution, you may need:

```bash
sudo apt update
sudo apt install -y build-essential python3 make g++ libudev-dev
```

---

## Getting started

Clone the repository:

```bash
git clone https://github.com/<owner>/machine-interfacing-app.git
cd machine-interfacing-app
```

Install dependencies:

```bash
npm install
```

Build the Angular app:

```bash
npm run build:web
```

Build Electron main and preload:

```bash
npm run build:electron
```

Run development mode:

```bash
npm run electron:dev
```

---

## Development workflow

### Start web-only development

```bash
npm start
```

### Start Electron development

```bash
npm run electron:dev
```

### Build renderer

```bash
npm run build:web
```

### Build Electron

```bash
npm run build:electron
```

### Full release build

```bash
npm run build:release
```

### Clean generated outputs

```bash
npm run clean
```

---

## Configuration

Most application configuration is stored locally in SQLite through the app UI.

### Common configuration areas

- Machines
- Targets
- Routing rules
- Mapping rules
- LIS test-order profiles
- Simulation use cases
- Approval and outbound delivery behavior

### Environment variables

| Variable | Purpose |
| --- | --- |
| `MI_DISABLE_AUTO_UPDATE=1` | Disable auto-update checks for local packaged testing |
| `ELECTRON_ENABLE_LOGGING=1` | Enable Electron logging for troubleshooting |
| `ELECTRON_ENABLE_STACK_DUMPING=1` | Enable stack dumping for crash diagnostics |

Use `MI_DISABLE_AUTO_UPDATE=1` only for local testing when release metadata is not yet published.

---

## Database and storage

The app uses local SQLite storage for operational data.

Typical stored data includes:

- Machine configuration.
- Runtime sessions.
- Traffic logs.
- Parsed messages.
- Normalized results.
- Result workflow records.
- LIS profiles.
- Mappings.
- Routing rules.
- Outbound queue items.
- Audit events.
- Deployment readiness diagnostics.

The exact database path can be inspected from:

```text
Audit & Readiness → Readiness → Packaging and deployment diagnostics
```

Use the built-in **Create DB backup** action before upgrades, major configuration changes, and production rollout.

---

## Machine runtime and simulation

### Live runtime

The runtime layer supports starting and stopping machine communication sessions. It records session status and links runtime traffic to parser and normalizer output.

Typical verification flow:

1. Register a machine.
2. Configure protocol and connection settings.
3. Start runtime.
4. Confirm traffic is captured.
5. Inspect parsed messages.
6. Inspect normalized results.
7. Confirm session traceability.

### Simulation

Simulation is used to validate analyzer message handling without a physical analyzer.

Typical verification flow:

1. Open the machine simulation workspace.
2. Select or create a simulation use case.
3. Run the simulation.
4. Confirm traffic logs are created.
5. Confirm parsed and normalized results are produced.
6. Confirm audit and session traceability.

---

## LIS profiles and OpenMRS delivery

The OpenMRS LIS delivery flow is profile-aware.

### Profile concept

One profile represents:

```text
One LIS target + one LIS test order
```

A profile defines the expected analyzer parameters for a specific LIS test order and supports validation before payload generation.

### Typical LIS setup flow

1. Configure OpenMRS LIS target.
2. Fetch representative sample metadata.
3. Discover test orders and parameters.
4. Create one profile per LIS test order.
5. Configure mapping rules for analyzer code/value to OpenMRS concept/coded answer/allocation metadata.
6. Validate mapping coverage.
7. Preview payload.
8. Approve result.
9. Route and queue payload.
10. Deliver to OpenMRS LIS.

### OpenMRS LIS payload endpoint

The app is designed to post result payloads to the OpenMRS LIS multiple-results endpoint:

```text
/openmrs/ws/rest/v1/lab/multipleresults
```

---

## Audit, security, and readiness

### Audit trail

The audit layer records key operational actions, including:

- Machine create/update/delete.
- Runtime start/stop/restart/failure.
- Simulation use-case save/delete/run.
- Target create/update/delete/test.
- Mapping create/update/delete.
- LIS profile save/enable/disable/delete.
- Outbound queue create/requeue/rebuild/send/fail.
- Database backup creation.

### Redaction

Sensitive data is redacted before storage or display. Redaction covers values such as:

- Passwords.
- Tokens.
- API keys.
- Secrets.
- Authorization headers.
- Cookies.
- Session-like values.
- Bearer and Basic credentials.

### Readiness checks

Readiness checks cover:

- Required database tables.
- Runtime trace columns.
- Audit table availability.
- Machine configuration.
- Target configuration.
- LIS profile completeness.
- Mapping availability.
- Outbound queue health.
- Database path.
- Logs path.
- Backup path.
- Storage write permissions.
- Packaging configuration.

---

## Packaging and distribution

### Linux

Build on Linux:

```bash
npm run clean
npm install
npm run build:release
npx electron-builder --linux AppImage deb --x64 --publish never
```

Expected artifacts:

```text
release/Machine Interfacing App-<version>-linux-x86_64.AppImage
release/Machine Interfacing App-<version>-linux-amd64.deb
```

Install `.deb`:

```bash
sudo apt install "./release/Machine Interfacing App-1.0.0-linux-amd64.deb"
machine-interfacing-app
```

Run AppImage:

```bash
chmod +x "release/Machine Interfacing App-1.0.0-linux-x86_64.AppImage"
"./release/Machine Interfacing App-1.0.0-linux-x86_64.AppImage"
```

### Windows

Build on Windows:

```powershell
npm run clean
npm install
npm run build:release
npx electron-builder --win nsis --x64 --publish never
```

Expected artifact:

```text
release/Machine Interfacing App-<version>-win-x64.exe
```

### macOS

Build on macOS:

```bash
npm run clean
npm install
npm run build:release
npx electron-builder --mac dmg zip --x64 --arm64 --publish never
```

Expected artifacts:

```text
release/Machine Interfacing App-<version>-mac-x64.dmg
release/Machine Interfacing App-<version>-mac-x64.zip
release/Machine Interfacing App-<version>-mac-arm64.dmg
release/Machine Interfacing App-<version>-mac-arm64.zip
```

For production macOS releases, configure code signing and notarization.

---

## Auto-update strategy

Auto-update is required for production builds.

Recommended behavior:

- Development mode: auto-update is skipped.
- Local packaged testing: auto-update may be disabled with `MI_DISABLE_AUTO_UPDATE=1`.
- Production packaged builds: auto-update is enabled and points to a real release provider.

### GitHub Releases provider

Use a real GitHub organization/account slug and repository name:

```json
{
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "<github-owner>",
        "repo": "machine-interfacing-app",
        "releaseType": "release"
      }
    ]
  }
}
```

Do not use placeholders such as:

```text
YOUR_REPO
```

Do not use owner values containing spaces. Use the actual GitHub slug.

### Generic HTTPS provider

For controlled institutional deployments, a generic HTTPS update server may be preferred:

```json
{
  "build": {
    "publish": [
      {
        "provider": "generic",
        "url": "https://updates.example.org/machine-interfacing/stable/"
      }
    ]
  }
}
```

### Production publishing

Linux:

```bash
npx electron-builder --linux AppImage deb --x64 --publish always
```

Windows:

```powershell
npx electron-builder --win nsis --x64 --publish always
```

macOS:

```bash
npx electron-builder --mac dmg zip --x64 --arm64 --publish always
```

---

## Release checklist

Before releasing a production build, complete the following.

### Build and package

- [ ] Version is updated in `package.json`.
- [ ] `description`, `author`, `license`, `homepage`, and repository metadata are present.
- [ ] Icons exist for Linux, Windows, and macOS.
- [ ] `npm run build:web` passes.
- [ ] `npm run build:electron` passes.
- [ ] Linux AppImage builds.
- [ ] Linux `.deb` builds and installs.
- [ ] Windows NSIS installer builds and installs.
- [ ] macOS `.dmg` and `.zip` build.
- [ ] macOS signing and notarization are configured for production.

### Functional validation

- [ ] App opens after install.
- [ ] Audit & Readiness opens.
- [ ] Create DB backup works.
- [ ] Machines page opens.
- [ ] Targets page opens.
- [ ] LIS Test-Order Profiles page opens.
- [ ] Outbound Queue page opens.
- [ ] Runtime start/stop/restart works.
- [ ] Simulation use cases run.
- [ ] Parsed and normalized results are created.
- [ ] Approval and routing workflow works.
- [ ] Payload preview and rebuild work.
- [ ] Outbound delivery works.

### Security and audit

- [ ] Secrets are not displayed in UI.
- [ ] Audit events are recorded.
- [ ] Audit payloads are redacted.
- [ ] Readiness checks run successfully.
- [ ] Backup path is writable.
- [ ] Logs path is writable.
- [ ] No placeholder update repository remains.
- [ ] Auto-update points to a valid production release provider.

---

## Troubleshooting

### Linux app crashes with segmentation fault

Try launching with Linux stability flags:

```bash
machine-interfacing-app --no-sandbox --disable-gpu --disable-gpu-compositing --ozone-platform=x11
```

If that works, ensure Linux runtime flags are applied in Electron main startup for packaged Linux builds.

### Auto-update returns GitHub 404

Cause:

```text
The app is pointing to a placeholder or inaccessible GitHub release repository.
```

Fix:

- Configure a real `build.publish` provider.
- Publish release artifacts and update metadata.
- For local testing only, run:

```bash
MI_DISABLE_AUTO_UPDATE=1 machine-interfacing-app
```

### `.deb` metadata error

Ensure `package.json` includes:

- `description`
- `author.name`
- `author.email`
- `homepage`
- `license`
- `build.linux.maintainer`

### Linux icon conversion error

Ensure the icon set includes valid PNG files:

```text
build/icons/16x16.png
build/icons/32x32.png
build/icons/48x48.png
build/icons/64x64.png
build/icons/128x128.png
build/icons/256x256.png
build/icons/512x512.png
build/icons/icon.png
build/icons/icon.ico
build/icons/icon.icns
```

For Linux, point Electron Builder to:

```json
"linux": {
  "icon": "build/icons/512x512.png"
}
```

### Native module mismatch

Run:

```bash
npm run rebuild:native
```

or reinstall dependencies:

```bash
npm install
```

Electron Builder should rebuild native modules during packaging when configured with:

```json
"postinstall": "electron-builder install-app-deps"
```

---

## Security considerations

This application processes laboratory and patient-adjacent operational data. Production deployments should apply the following controls:

- Restrict access to the desktop environment.
- Protect the local SQLite database and backups.
- Use strong target credentials.
- Avoid storing credentials in URLs.
- Use HTTPS for LIS/API targets.
- Enable audit trail monitoring.
- Review audit logs after sensitive actions.
- Keep release artifacts and update metadata protected.
- Sign production builds where supported.
- Ensure local privacy and health data compliance requirements are met.

---

## Contributing

For internal project contributions:

1. Create a branch from `main`.
2. Keep changes scoped.
3. Avoid rolling back existing milestone behavior.
4. Run Angular and Electron builds.
5. Test affected workflows.
6. Document migration or packaging impact.
7. Submit a pull request with screenshots or logs where relevant.

Suggested branch naming:

```text
feature/<short-description>
fix/<short-description>
release/<version>
```

---

## License

Private / Proprietary.

Copyright © UDSM DHIS2 Lab.

This software is intended for authorized laboratory and health information system deployments only.