<!--
Sync Impact Report
Version change: unversioned template -> 1.0.0
Modified principles:
- [PRINCIPLE_1_NAME] -> I. Smallest Viable Change
- [PRINCIPLE_2_NAME] -> II. CLI Contract Stability
- [PRINCIPLE_3_NAME] -> III. Test-Driven Delivery (NON-NEGOTIABLE)
- [PRINCIPLE_4_NAME] -> IV. Dependency and Pattern Approval
- [PRINCIPLE_5_NAME] -> V. Explicit Failures and Operability
Added sections:
- Additional Constraints
- Delivery Workflow
Removed sections:
- None
Templates requiring updates:
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md
Follow-up TODOs:
- None
-->
# Headless Logs CLI Constitution

## Core Principles

### I. Smallest Viable Change
Every change MUST solve the stated problem with the least amount of code, the
smallest possible diff, and the narrowest affected surface area. Existing
modules, command flows, and data shapes MUST be reused before introducing new
abstractions. Refactors that do not directly support the current change MUST be
deferred. Rationale: this CLI is operational tooling, so smaller changes reduce
regression risk and keep diagnosis straightforward.

### II. CLI Contract Stability
Commands, flags, environment variable inputs, file outputs, and documented usage
examples are public contracts and MUST remain stable unless a change is
explicitly approved. Behavior changes SHOULD be additive by default. Any
breaking CLI change MUST be called out in the plan, justified, documented, and
versioned appropriately. Rationale: operators depend on predictable automation
surfaces and repeatable log export workflows.

### III. Test-Driven Delivery (NON-NEGOTIABLE)
Behavior changes and bug fixes MUST begin with the smallest automated test or
executable check that can fail for the intended behavior. Implementation MUST
follow the red-green-refactor cycle: write the check, observe it fail, make it
pass, then clean up without widening scope. Documentation-only changes MAY skip
executable validation, but the reason MUST be stated explicitly. Rationale:
focused failing checks are the fastest way to prevent regressions in a CLI that
touches remote APIs, files, and compressed log payloads.

### IV. Dependency and Pattern Approval
New libraries, frameworks, major abstractions, or architectural patterns MUST
not be added without explicit user approval. The default choice is the existing
stack, standard library facilities, and current code organization. When a new
dependency or pattern is proposed, the change request MUST explain why the
simpler existing approach is insufficient. Rationale: dependency sprawl and
premature abstraction create long-term maintenance cost that outweighs short-
term convenience in a small CLI.

### V. Explicit Failures and Operability
Failures MUST be actionable, concise, and safe: commands write human-meaningful
errors to stderr, avoid leaking secrets, and preserve enough context to debug
tenant, site, date-prefix, and output-path issues. User-visible changes MUST
update README usage examples in the same change. Rationale: this tool is used to
retrieve production-facing logs, so operability depends on clear diagnostics and
accurate documentation.

## Additional Constraints

- The implementation baseline is Node.js 18+ with the existing ESM CLI layout.
- Secrets MUST be supplied through approved inputs and MUST never be echoed in
  logs, examples, or error messages.
- New dependencies or new architectural patterns are out of scope until the
  user explicitly approves them.
- README updates are REQUIRED for any user-visible CLI behavior, flag, output,
  or setup change.

## Delivery Workflow

1. Define the target behavior and name the smallest automated test or executable
	check that can fail first.
2. Reuse the nearest existing command, service, or utility before adding new
	files or abstractions.
3. If a new dependency or pattern seems necessary, stop and obtain explicit user
	approval before implementation continues.
4. Validate the touched slice with the focused failing check, then rerun the
	passing check after implementation.
5. Update README examples for any user-visible behavior change before the work
	is considered complete.

## Governance

This constitution overrides conflicting local process guidance for this
repository. Amendments require a documented update to this file, a brief reason
for the change, and synchronization of affected Spec Kit templates before the
amendment is considered adopted. Compliance review is mandatory in planning,
task generation, implementation, and review: plans MUST record constitution
gates, tasks MUST reflect test-first sequencing, and reviewers MUST block
changes that add unapproved dependencies, broaden scope without justification,
or alter CLI contracts silently.

Versioning policy follows semantic versioning for governance documents: MAJOR
for incompatible principle removals or redefinitions, MINOR for new principles
or materially expanded obligations, and PATCH for clarifications that do not
change expected behavior. Because this file is the first concrete adoption of an
otherwise empty template, this amendment establishes version 1.0.0.

**Version**: 1.0.0 | **Ratified**: 2026-06-01 | **Last Amended**: 2026-06-01
