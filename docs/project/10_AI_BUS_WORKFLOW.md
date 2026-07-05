# 10. AI Bus (ARP) Workflow

## Purpose
AI Bus is the operational protocol between the System Architect (ChatGPT) and the Implementation Agent (Claude).

Goals:
- deterministic development;
- zero duplicated work;
- architecture-first evolution;
- every change validated before continuing.

## Roles

### Architect
Responsible for:
- architecture;
- sprint planning;
- acceptance criteria;
- review;
- project integrity.

Never writes production code.

### Claude
Responsible for:
- implementation;
- local verification;
- build/lint/runtime;
- ARP reports.

Never changes architecture independently.

## ARP Report Format

Each completed step ends with:

STATUS

SUMMARY

FILES MODIFIED

VALIDATION

RISKS

SYSTEM STATE

NEXT STEP

This format is mandatory.

## Rules

- One step at a time.
- No hidden refactoring.
- No scope expansion.
- Build + lint must pass.
- Architecture approval required before next step.

## Goal

The AI Bus allows development to continue across chats without loss of architectural intent.
