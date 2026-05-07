# AGENTS.md

## Purpose

This document defines the default working rules for agents and developers operating in this repository.

## Privacy and Personal Data

- Treat personal data as sensitive at all times.
- Do not leave names, emails, phone numbers, addresses, account identifiers, access tokens, secrets, or similar data in code, docs, logs, or test fixtures unless strictly required.
- If personal data is needed for examples or tests, use masked or fake data.
- Do not collect, store, or expose user personal data unnecessarily when integrating external APIs or services.

## Testing Is Required After Every Change

- After any change, you must run tests.
- Work is not considered complete without testing.
- If tests fail, investigate the cause, fix it, and run the tests again.

## Test File Location

- Any test file created or updated by an agent must live under `tests/agent/`.
- Add a new test file or update an existing file in `tests/agent/` based on the scope of the change.
- Test file names should clearly describe their purpose.
- Example: `tests/agent/upload-flow.test.ts`
- Example: `tests/agent/auth-guard.test.ts`

## Definition of Done

The following must all be completed before work is considered done:

- The requested change is implemented.
- Related tests are added or updated.
- Tests are executed and results are checked.
- Documentation is updated when needed.
