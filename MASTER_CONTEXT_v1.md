MASTER_CONTEXT_v1.md

MASTER PROJECT DOCUMENT
Literary Studio
Single Source of Truth

====================================================
Table of Contents
====================================================

Part I. Project

Chapter 1.
Project Overview

Chapter 2.
Project Philosophy

Chapter 3.
Current Project State
(Current after Sprint 06)

Chapter 4.
Development Methodology
(Architect + Claude + AI Bus)

Chapter 5.
Product Roadmap
(40 Sprints)


====================================================
Part II. Product
====================================================

Chapter 6.
Complete Product Description

Chapter 7.
Domain Model

Chapter 8.
User Experience

Chapter 9.
Application Architecture


====================================================
Part III. AI Architecture
====================================================

Chapter 10.
AI Bus Architecture

Chapter 11.
AI Expert System

Chapter 12.
Expert Contract

Chapter 13.
Prompt Architecture

Chapter 14.
Context Management


====================================================
Part IV. Development Process
====================================================

Chapter 15.
Architecture Rules

Chapter 16.
Development Workflow

Chapter 17.
Architecture Review Process

Chapter 18.
Sprint Rules

Chapter 19.
ARP Specification


====================================================
Part V. Future
====================================================

Chapter 20.
Version 1.x Roadmap

Chapter 21.
Version 2.x Vision

Chapter 22.
Long-term Architecture


====================================================
Appendices
====================================================

Appendix A.
Glossary

Appendix B.
Architecture Decision History

Appendix C.
AI Expert Catalog

Appendix D.
Directory Structure

Appendix E.
Technology Stack

Appendix F.
Known Limitations

Appendix G.
Open Questions



Chapter 1. Purpose, Philosophy & Vision
Literary Studio
Operational Context Document

Version: 1.0

Status: Living Document

Audience:

Chief Software Architect
Lead Software Engineer
Future AI sessions
Future human developers

This document is the primary operational handbook of the Literary Studio project.

It is intended to transfer the complete architectural context of the project into any future AI session or development team member with minimal information loss.

This document explains not only what the system is, but why it exists, how decisions are made, which decisions have already been made, and which principles must never be violated.

This document complements, but does not replace:

README
ADR documents
Project documentation
Sprint documentation

When this document conflicts with temporary discussion, this document wins.

When this document conflicts with implementation, implementation must be reviewed.

When this document conflicts with an Accepted ADR, the ADR wins.

1. Purpose of Literary Studio

Literary Studio is an integrated development environment (IDE) for writers.

It is not an AI writer.

It is not a chatbot.

It is not a prompt playground.

It is not a text generation service.

Its purpose is fundamentally different.

The system is designed to become the professional workspace in which an author creates, edits, analyses and evolves a literary work with assistance from specialized AI experts.

The author remains the creator.

AI performs professional roles.

Exactly as a real publishing process involves editors, critics, proofreaders, beta readers and literary consultants, Literary Studio models these roles as independent AI experts.

The system is therefore an IDE for literature in the same sense that modern software engineers work inside an IDE rather than exchanging emails with a compiler.

2. Fundamental Philosophy

The central philosophy of Literary Studio is:

AI augments the author. It never replaces the author.

Every architectural decision must reinforce this principle.

Whenever there is uncertainty, the preferred solution is the one that preserves human authorship.

The author owns:

ideas
plot
characters
style
creative decisions

AI owns only professional assistance.

This distinction is one of the core identities of the product.

3. Professional Roles instead of Generic AI

Most AI writing products expose a single language model.

Literary Studio intentionally rejects this model.

Instead, the system consists of many specialists.

Examples include:

Line Editor
Critic
Reader
Co-author
Proofreader
Style Editor

Future experts may include dozens of additional professional roles.

Every expert has:

a professional identity
a defined responsibility
defined inputs
defined outputs
limited authority

No expert should become a "universal assistant."

This keeps the system understandable, predictable and extensible.

4. Product Identity

Literary Studio is closer to:

JetBrains IDEs
Visual Studio
Figma
DaVinci Resolve

than to:

ChatGPT
Claude Chat
Gemini
generic AI assistants

The user edits a persistent project.

The manuscript is always the primary object.

Conversation is secondary.

The project must remain usable even if AI is temporarily unavailable.

The manuscript must never become an ephemeral conversation artifact.

5. Long-Term Vision

The current implementation focuses on fiction.

This is not the long-term scope.

The architecture is intentionally designed so that the same platform can later support:

novels
short stories
screenplays
stage plays
technical books
documentation
articles
educational content
non-fiction

The domain model should therefore evolve toward "structured writing" rather than "novels only."

This principle influences architectural decisions today.

6. Evolution Before Generalization

One of the strongest principles of this project comes from ADR-0002.

The project intentionally refuses premature abstraction.

The order is always:

Build one working implementation.
Observe its real behaviour.
Extract the contract.
Validate it.
Generalize only after validation.

Never reverse this sequence.

This rule has already shaped several architectural decisions:

Expert Contract
AI Bus
Workspace
Domain model

Whenever a developer proposes a generic abstraction before at least one concrete implementation has proven it necessary, that proposal should be rejected.

7. Stability Over Cleverness

Architectural elegance is desirable.

Architectural stability is mandatory.

The project consistently prefers:

explicit code
understandable code
small components
predictable behaviour

over:

clever abstractions
hidden frameworks
metaprogramming
speculative architecture

Future developers should be able to understand the system by reading it, not by reverse-engineering abstractions.

8. Human-Centered Design

The product exists to improve the writing process.

Not to demonstrate AI capabilities.

Whenever a technical possibility conflicts with a better author experience, the author experience wins.

Examples:

AI suggestions should be reviewable.

AI must not silently modify manuscripts.

AI changes should be explicit.

The author must always retain final control.

9. Project Success

Success is not measured by:

number of AI models
number of prompts
number of agents
number of features

Success is measured by one question:

Can a serious writer comfortably create an entire book inside Literary Studio?

Every sprint should move the project closer to that objective.

10. The Architectural North Star

Every future decision should be evaluated against one sentence:

Literary Studio is a professional IDE where specialized AI experts help authors create better books while preserving complete human creative ownership.

If a proposed feature weakens this statement, it is probably the wrong feature.

If a proposed architecture makes this statement harder to realize, it is probably the wrong architecture.

End of Chapter 1

Chapter 2. Product Model
2. Product Model
2.1 Product Definition

Literary Studio is a persistent writing environment.

The central object of the system is the manuscript.

Everything else exists only to help the author improve that manuscript.

The manuscript is never treated as a temporary prompt.

It is a long-lived project consisting of structured entities.

The author works with the project.

AI works on individual parts of the project.

2.2 Primary Entity

The primary entity of the entire system is:

Book

Everything else belongs to a Book.

The Book represents an author's complete work.

It persists independently of AI.

AI may assist with the Book.

AI never owns the Book.

2.3 Current Domain Model

Current hierarchy:

Book
 ├── Chapters
 │      ├── Scenes
 │      │      └── Text
 │      └── ...
 └── Metadata

Current implementation intentionally remains simple.

The architecture must allow future expansion without breaking existing manuscripts.

2.4 Scene

A Scene is the smallest meaningful editing unit.

AI Experts work on Scenes.

Not on entire books.

Not on arbitrary text fragments.

Reasons:

predictable context size
clear ownership
limited AI responsibility
future parallel processing

Future experts may operate on larger scopes, but Scene remains the default unit.

2.5 Author Ownership

Every Scene always belongs to the author.

AI never creates hidden state.

AI never stores private copies.

AI never silently modifies content.

Every modification is explicit.

Every modification is initiated by the author.

2.6 Workspace

Workspace represents the current editing session.

Current Workspace contains:

Book
selected chapter
selected scene

The Workspace is persisted.

Currently persistence uses localStorage.

Future persistence will migrate to a database.

The Workspace is independent from AI.

AI consumes Workspace information but never owns it.

2.7 Persistence Philosophy

Persistence exists to preserve author work.

It is not part of AI.

Storage is an infrastructure concern.

Current implementation:

Workspace
      ↓
workspaceStorage
      ↓
localStorage

Future implementation:

Workspace
      ↓
Workspace Repository
      ↓
Database

The domain model should remain unchanged during that migration.

2.8 AI is Stateless

One of the most important architectural principles:

AI does not own project state.

Current AI requests are completely independent.

Each request receives everything it needs.

Each request returns a result.

Nothing remains inside AI after completion.

This property is intentional.

Future long-term memory, project memory or semantic indexing may be introduced later, but they must become explicit architectural components rather than hidden behaviour inside AI.

2.9 Product Roles vs AI Experts

These are different concepts.

They must never be confused.

Product Role

A Product Role describes a professional responsibility.

Examples:

Critic
Reader
Co-author
Line Editor

This is a user-facing concept.

AI Expert

An AI Expert is a software implementation of one Product Role.

Multiple Product Roles may eventually share implementation.

One Product Role may eventually have multiple implementations.

Therefore:

Product Role
        ≠
AI Expert

Current implementation has only one fully implemented AI Expert:

Line Editor

Future experts will be introduced one at a time.

2.10 Review vs Revision

This distinction is fundamental.

Revision changes the manuscript.

Examples:

grammar correction
punctuation
wording
rewriting

Review does not change the manuscript.

Review produces professional feedback.

Examples:

critique
reader reaction
literary analysis
strengths
weaknesses

This distinction already exists in the product documentation.

Current implementation still supports only Revision.

Support for Review will be introduced only after the Expert Contract has been formally ratified.

2.11 AI Must Never Become the Source of Truth

The source of truth is always:

Workspace

never

AI

AI may suggest.

AI may analyse.

AI may review.

AI may rewrite.

But after every request, the authoritative state remains inside the Workspace.

2.12 Product Evolution

The product is intentionally evolving through validated increments.

The expected evolution is roughly:

Persistent Workspace

↓

Single Expert

↓

Multiple Experts

↓

Expert Collaboration

↓

Project Knowledge

↓

Publishing Pipeline

↓

Professional Writing Platform

Every stage must remain functional before the next stage begins.

No future capability should be designed before its predecessor has been validated in practice.

2.13 Current Product State

At the end of Sprint 06 the product provides:

persistent workspace
book management
chapter management
scene management
text editing
AI Line Editor
architectural AI Bus
domain model
workspace controller
storage boundary

The product does not yet provide:

real Critic
real Reader
multiple AI Experts
project memory
expert collaboration
semantic knowledge
publishing workflow
cloud synchronization

Those capabilities belong to future phases.

2.14 Product Invariants

The following statements must remain true unless explicitly changed by an Accepted ADR:

The manuscript belongs to the author.
AI never silently modifies the manuscript.
Workspace is the source of truth.
AI is stateless.
Storage is independent from AI.
Product Roles are distinct from AI Experts.
Revision is different from Review.
New Experts are introduced incrementally.
Architecture follows validated evolution rather than speculative design.
Every architectural layer exists to simplify future development, not to increase abstraction for its own sake.
End of Chapter 2

Chapter 3. System Architecture
3. System Architecture
3.1 Architecture Overview

Literary Studio is organized as a layered architecture.

Each layer has a single responsibility.

Every dependency points downward.

No lower layer depends on a higher layer.

The architecture intentionally avoids circular dependencies.

Current high-level architecture:

+------------------------------------------------------+
|                      USER                            |
+------------------------------------------------------+

                     │

                     ▼

+------------------------------------------------------+
|                     UI Layer                         |
|                                                      |
|  page.tsx                                            |
|  Header                                              |
|  Sidebar                                             |
|  EditorArea                                          |
|  AssistantPanel                                      |
|  DeveloperTools                                      |
+------------------------------------------------------+

                     │

                     ▼

+------------------------------------------------------+
|              Workspace Controller                    |
|                                                      |
| useWorkspaceController()                             |
+------------------------------------------------------+

             │                     │

             ▼                     ▼

+--------------------+     +--------------------------+
|    Domain Layer    |     |     Storage Layer        |
|                    |     |                          |
| Book               |     | workspaceStorage         |
| Chapter            |     |                          |
| Scene              |     | localStorage             |
| Workspace          |     |                          |
+--------------------+     +--------------------------+

             │

             ▼

+------------------------------------------------------+
|                  AI Bus Layer                        |
|                                                      |
| Operation                                            |
| Context                                              |
| Response                                             |
| Applied Response                                     |
+------------------------------------------------------+

                     │

                     ▼

+------------------------------------------------------+
|                  AI Backend                          |
|                                                      |
| /api/line-editor                                     |
+------------------------------------------------------+

                     │

                     ▼

+------------------------------------------------------+
|                 AI Provider                          |
|                                                      |
| Claude / OpenAI / Future Providers                   |
+------------------------------------------------------+
3.2 Dependency Rule

Dependencies must always flow downward.

Allowed:

UI

↓

Workspace Controller

↓

Domain

↓

Storage

Allowed:

UI

↓

AI Bus

↓

Backend

Forbidden:

Storage

↓

UI

Forbidden:

Domain

↓

UI

Forbidden:

AI Bus

↓

Editor Components
3.3 UI Layer

The UI exists only to:

display state
receive user input
call controller methods
display AI responses

The UI should not contain:

business rules
persistence logic
AI routing
domain mutations

The UI should remain as "dumb" as practical.

3.4 Workspace Controller

The Workspace Controller is the application's brain.

Its responsibilities:

hold Workspace state
update Workspace
load Workspace
save Workspace
expose operations

It should know nothing about rendering.

It should know nothing about React components.

It should know nothing about visual layout.

3.5 Domain Layer

The Domain Layer describes the writing world.

It defines:

Book
Chapter
Scene
Workspace

The Domain Layer must remain independent from:

React
localStorage
AI
API

The Domain Layer should survive complete replacement of UI or backend.

3.6 Storage Layer

The Storage Layer has exactly one responsibility:

Persist Workspace.

Current implementation:

Workspace

↓

workspaceStorage

↓

localStorage

Future implementation:

Workspace

↓

Workspace Repository

↓

Database

The Workspace Controller should not care which implementation exists.

3.7 AI Bus

The AI Bus is the boundary between the application and AI.

The UI never talks directly to AI.

The backend never talks directly to UI.

Everything passes through AI Bus.

Current pipeline:

Operation

↓

Context Envelope

↓

AI Bus

↓

Backend

↓

AI Response

↓

Applied Response

The AI Bus exists to isolate the rest of the application from AI implementation details.

3.8 AI Backend

The backend has one responsibility:

Execute AI requests.

It should not:

store Workspace
own business logic
own UI state

Current backend remains intentionally stateless.

3.9 AI Provider

The AI Provider is replaceable.

Current implementation uses one provider.

Future architecture should support multiple providers.

The application should never depend directly on provider SDK APIs.

Only the backend communicates with providers.

3.10 Separation of Responsibilities

Each layer owns exactly one kind of responsibility.

Layer	Responsibility
UI	Presentation
Workspace Controller	Application logic
Domain	Business model
Storage	Persistence
AI Bus	AI communication
Backend	AI execution
Provider	Model inference

Whenever one layer begins owning responsibilities from another layer, architectural erosion has begun.

3.11 Why AI Bus Exists

AI Bus was introduced during Sprint 06.

It exists because direct UI → fetch() calls become impossible to maintain once:

multiple AI Experts appear
multiple providers appear
routing appears
caching appears
retries appear
telemetry appears
usage accounting appears

The current AI Bus intentionally implements only a small subset of future responsibilities.

It is a structural seam, not a framework.

3.12 Current AI Bus

Current pipeline:

AIOperation

↓

AIContextEnvelope

↓

AIResponse

↓

AppliedAIResponse

Today these layers remain intentionally lightweight.

Some fields are not yet consumed.

This is expected.

The architecture was introduced first.

Behaviour will evolve incrementally.

3.13 Stateless Architecture

Every AI request is independent.

Current execution flow:

Workspace

↓

Create Context

↓

Send Request

↓

Receive Response

↓

Discard Request Context

Nothing remains inside AI.

State always returns to Workspace.

3.14 Architectural Boundaries

Every boundary was introduced to isolate change.

Examples:

Changing persistence should not affect AI.

Changing AI should not affect Workspace.

Changing UI should not affect Domain.

Changing providers should not affect EditorArea.

If changing one subsystem requires modifications across unrelated layers, the boundary has failed.

3.15 Architecture Principles

The current architecture follows these principles:

Single Responsibility
Explicit Dependencies
Stateless AI
Persistent Workspace
Domain First
Evolutionary Architecture
No speculative abstraction
Replaceable infrastructure
Human-controlled workflow

These principles should remain more stable than the implementation itself.

3.16 Current Architecture Status

At the end of Sprint 06:

✅ Domain Layer exists.

✅ Workspace Controller exists.

✅ Storage Boundary exists.

✅ AI Bus exists.

✅ Page is orchestration-only.

✅ Dependencies are one-directional.

Not yet implemented:

multiple AI Experts
AI routing
provider abstraction
cloud persistence
project memory
expert collaboration

These will be introduced only when justified by working implementations.

End of Chapter 3

Chapter 4. AI Engineering Bus (AIBus)
4. AI Engineering Bus (AIBus)
4.1 Purpose

AI Bus (AIBus) is not part of Literary Studio.

It is the engineering system used to build Literary Studio.

It coordinates the work of two AI systems:

ChatGPT
Claude Code

The purpose of AIBus is to make development deterministic, traceable and scalable.

Without AIBus every new chat becomes a new developer.

With AIBus every new chat continues the work of the previous one.

4.2 Roles

The project deliberately separates architectural thinking from implementation.

Chief Software Architect

Implemented by ChatGPT.

Responsibilities:

architecture
long-term planning
sprint planning
reviews
acceptance
risk analysis
ADR decisions
project integrity
preventing technical debt
preventing overengineering

The Architect normally does not write production code.

Lead Software Engineer

Implemented by Claude Code.

Responsibilities:

implementation
refactoring
debugging
validation
build
lint
testing
reporting

Claude does not change architecture independently.

4.3 Decision Authority

Authority is intentionally asymmetric.

Product Owner
        │
        ▼
Chief Software Architect
        │
        ▼
Lead Software Engineer

Product decisions belong to the Product Owner.

Architecture belongs to the Architect.

Implementation belongs to Claude.

4.4 Workflow

Every engineering task follows the same pipeline.

Architect

↓

Sprint

↓

Task

↓

Claude

↓

ARP Report

↓

Architect Review

↓

Approval

↓

Next Step

No implementation should skip this flow.

4.5 ARP

ARP means:

Architecture Review Protocol.

Every completed step ends with one ARP.

The ARP becomes the hand-off artifact.

The Architect never reviews raw code first.

The Architect reviews the ARP.

4.6 Mandatory ARP Structure

Every ARP should contain:

STATUS

SUMMARY

FILES MODIFIED

VALIDATION

RISKS

SYSTEM STATE

NEXT STEP

This format is mandatory.

It should remain stable across the project.

4.7 Responsibilities of Claude

Claude should:

implement only approved work
avoid speculative abstractions
stop when architecture becomes unclear
report risks
validate every change
never silently expand scope

Claude must never assume approval.

4.8 Responsibilities of the Architect

The Architect should:

keep long-term consistency
prevent architectural drift
reject unnecessary abstractions
approve every sprint
define priorities
detect contradictions
maintain project integrity

The Architect should avoid rewriting Claude's code unless necessary.

4.9 Responsibilities of Product Owner

The Product Owner defines:

priorities
roadmap
scope
product vision
acceptance

The Product Owner does not need to decide implementation details.

4.10 Sprint Structure

Every sprint should have:

Goal

Architecture target

Independent steps

Validation

Definition of Done

Closeout Report

Each step should be independently verifiable.

4.11 One Step — One Responsibility

Steps should remain small.

A step should ideally:

modify one subsystem
have one architectural goal
produce one ARP

Large refactorings should be decomposed.

4.12 Validation Requirements

Every implementation step should include:

build
lint
formatting
runtime verification
grep verification (when applicable)

The Architect assumes nothing.

Everything should be demonstrated.

4.13 Architecture Before Features

AIBus intentionally prioritizes architecture.

The preferred order is:

Architecture

↓

Validation

↓

Feature

rather than

Feature

↓

Fix Architecture Later
4.14 No Hidden Decisions

Any significant decision must appear in one of:

ADR
PROJECT_STATE
CURRENT_SPRINT

Conversation is never the source of truth.

4.15 Architecture Discovery

When uncertainty exists:

do not invent.

Discover.

Prototype.

Validate.

Then document.

This principle comes directly from Evolutionary Architecture.

4.16 Handling Disagreement

If Claude discovers:

contradiction
impossible implementation
hidden requirement
architectural flaw

implementation stops.

Claude reports.

The Architect decides.

Silent workarounds are prohibited.

4.17 Preventing Hallucinations

The biggest source of engineering errors is assumption.

Therefore:

Never assume previous decisions.

Never assume hidden requirements.

Never invent missing architecture.

Always check:

repository
ADR
PROJECT_STATE
current sprint

before proposing change.

4.18 Context Recovery

Every new chat should recover context from documentation.

Priority:

Project Master Document
Current Sprint
PROJECT_STATE
ADR
Source code

Conversation history is the last resort.

4.19 Engineering Philosophy

AIBus values:

predictability

repeatability

small validated steps

explicit architecture

minimal abstraction

clear ownership

continuous verification

This philosophy is more important than any individual implementation.

4.20 Future Evolution of AIBus

Today AIBus is manual.

Future possibilities include:

automatic ARP generation
automatic architectural validation
automatic sprint tracking
automatic documentation synchronization
automatic regression detection
architectural dashboards
AI-assisted code review

These are future engineering capabilities.

They are not part of Literary Studio itself.

4.21 Success Criteria

AIBus is successful when:

no work is repeated
architecture remains coherent
new chats continue seamlessly
Claude never guesses architecture
the Architect never reviews undocumented implementation
every sprint produces a deterministic project state
End of Chapter 4

Chapter 5. Product Roadmap (Master Roadmap)
5. Product Roadmap
5.1 Vision

Literary Studio is developed incrementally.

Every sprint must produce a complete, working system.

The project never relies on a future sprint to make the current sprint "correct."

Architecture is built before it becomes necessary, but only after it has been validated by real implementations.

The roadmap is therefore evolutionary rather than predictive.

5.2 Release Strategy

The project is divided into six major phases.

Phase I
Foundation

↓

Phase II
Writing IDE

↓

Phase III
AI Experts

↓

Phase IV
Multi-user Platform

↓

Phase V
Production

↓

Phase VI
Release 1.0

Every phase should leave the application usable.

Phase I — Foundation (Completed)
Sprint 01

Project initialization

Repository

Documentation

Vision

Sprint 02

Editor prototype

Sprint 03

Workspace evolution

Sprint 04

Expert Contract discovery

(Line Editor)

Sprint 05

UI stabilization

Sprint 06

Architecture extraction

Completed.

Major achievements:

Domain Layer
Workspace Controller
AI Bus
Storage Boundary
orchestration-only page.tsx
Phase II — Writing IDE

Goal:

Create the best manuscript editor before adding additional AI capabilities.

Sprint 07

AI Bus ratification

Architecture documentation

ADR updates

Validation of Expert Contract

Definition of second Expert entry rules

Sprint 08

Rich Scene Editor

Planned features:

scene metadata
scene title
scene notes
scene status
scene statistics

Definition of Done:

Scene editing becomes comfortable for long-form writing.

Sprint 09

Chapter Management

Features:

create chapter
rename
reorder
delete
move scenes

Definition of Done:

Chapter management is complete.

Sprint 10

Character Database

Features:

characters
aliases
description
notes
relationships
usage in scenes

Definition of Done:

Characters become first-class project entities.

Sprint 11

Book Metadata

Features:

synopsis
genre
target audience
themes
timeline
version information
Sprint 12

Search

Features:

global search
scene search
character search
chapter search
quick navigation
Sprint 13

History

Features:

scene history
undo
restore
compare
Sprint 14

Writing UX

Features:

keyboard shortcuts
split view
fullscreen
improved navigation
editor polishing
Phase III — AI Experts

Goal:

Transform Literary Studio into an AI IDE.

Sprint 15

Editor Expert

Production-ready

Sprint 16

Critic Expert

Professional critique

No manuscript modification

Sprint 17

Reader Expert I

General reader

Emotional response

Sprint 18

Reader Expert II

Experienced reader

Sprint 19

Reader Expert III

Genre-focused reader

Sprint 20

Reader Expert IV

Professional beta reader

Sprint 21

Expert Context Engine

Shared context

Prompt management

Context injection

Sprint 22

Expert Orchestrator

Ability to launch several experts

Collect responses

Present comparisons

Phase IV — Multi-user Platform

Goal:

Transform the application into a real online product.

Sprint 23

PostgreSQL

Prisma

Migration

Sprint 24

Authentication

Registration

Login

Sessions

Password reset

Sprint 25

Projects

Users

Ownership

Permissions

Sprint 26

Administration

Admin panel

User management

Roles

Sprint 27

Cloud Workspace

Persistent projects

Automatic save

Sprint 28

Collaboration

Project sharing

Future-ready collaboration model

Phase V — Production Readiness

Goal:

Prepare the product for public use.

Sprint 29

Settings

Application preferences

Editor preferences

AI preferences

Sprint 30

Import / Export

DOCX

TXT

Markdown

Project archive

Sprint 31

Documentation

User Guide

Developer Guide

Architecture Guide

Sprint 32

Error Handling

Diagnostics

Logging

Recovery

Sprint 33

Performance

Optimization

Profiling

Caching

Sprint 34

Production QA

Regression testing

Acceptance testing

Internal beta

Phase VI — Release

Goal:

Deliver Literary Studio 1.0

Sprint 35

Deployment

Server

Domain

HTTPS

Sprint 36

External Testing

Multiple users

Real projects

Feedback

Sprint 37

Bug Fix Sprint

Stabilization

Sprint 38

Release Candidate

RC1

Sprint 39

Final Validation

Architecture review

Documentation review

Regression review

Sprint 40

Version 1.0

Official release

5.3 Guiding Principles

Roadmap is not immutable.

Priorities may change.

Architecture principles must not.

The roadmap should evolve while preserving project integrity.

5.4 Success Criteria

The roadmap succeeds if, after Sprint 40, Literary Studio provides:

multi-user architecture
production deployment
AI Editor
AI Critic
four independent Reader Experts
project management
character management
manuscript management
administrator interface
user documentation
production stability

without requiring architectural redesign.

End of Chapter 5

Chapter 6 — Complete Product Description
====================================================
Chapter 6

Complete Product Description
====================================================
6.1 Mission

Literary Studio is a professional Integrated Development Environment (IDE) for writers.

It is not an AI chatbot.

It is not a text generator.

It is not an online editor.

It is a complete authoring environment where artificial intelligence acts as a team of specialized professionals working directly with the manuscript.

The writer remains the sole author of the work.

AI assists.

AI never replaces the author.

6.2 Core Idea

Traditional AI tools are conversation-centric.

Literary Studio is manuscript-centric.

The manuscript is the center of the system.

Everything else exists to improve the manuscript.

Not conversations.

Not prompts.

Not chat history.

Not generated text.

Every subsystem ultimately serves one purpose:

Help the author create a better book.

6.3 Product Vision

Literary Studio should eventually become the primary workspace for writing long-form fiction.

The application should support the complete creative process:

• planning

• drafting

• revising

• editing

• reviewing

• preparing publication

The long-term vision is to replace the need for dozens of disconnected writing utilities with one coherent environment.

6.4 Target Users

Primary audience

Professional fiction writers.

Secondary audience

Beginning authors.

Indie writers.

Editors.

Writing coaches.

Future audience

Screenwriters.

Technical writers.

Academic authors.

Journalists.

Non-fiction authors.

The architecture is intentionally domain-independent so that new writing domains can be introduced without redesigning the system.

6.5 Product Principles

The following principles are permanent.

Author First

The author owns every decision.

AI never silently changes the manuscript.

Every modification is explicit.

Every modification is reversible.

Manuscript First

The manuscript is the primary object.

Everything else is metadata.

Experts, not Chat

Users do not "talk to AI".

Users work with professional specialists.

Each specialist has one responsibility.

Transparency

The author always understands:

why AI produced a result,

which Expert produced it,

what part of the manuscript was analyzed,

what changed,

and why.

Evolution

The product grows by adding professional capabilities rather than increasing prompt complexity.

Every new Expert expands the author's team rather than making one "super AI."

Stability

Architecture evolves.

User workflow remains stable.

Features should improve existing workflows rather than forcing authors to learn completely new ones.

## 6.6 Core Objects of Literary Studio

Literary Studio is organized around a small number of core domain objects.

Every feature in the application exists either to create, edit, analyze or organize one of these objects.

No feature should introduce an alternative source of truth outside this model.

The hierarchy is intentionally simple.

Workspace
    └── Book
            ├── Chapter
            │      └── Scene
            │
            ├── Character
            │
            ├── Notes
            │
            └── AI Reviews
Workspace

Workspace is the highest-level container.

A Workspace represents everything currently opened by the user.

It contains:

books
current selection
editor state
UI state related to the project
application context

Workspace is not a literary object.

It is an application object.

Only one Workspace is active at a time.

In future versions, multiple Workspaces may coexist.

Book

A Book is the primary creative project.

Everything the author creates belongs to a Book.

A Book contains:

metadata
chapters
characters
notes
AI history
future project settings

A Book is the largest independent creative unit.

Books never reference each other.

Chapter

A Chapter is an ordered collection of scenes.

Its responsibilities are organizational.

A Chapter exists to structure the manuscript.

Chapters are intentionally lightweight.

Most creative work happens inside scenes.

Scene

The Scene is the fundamental editing unit of Literary Studio.

Every AI Expert operates on scenes.

Every revision belongs to a scene.

Every review refers to a scene.

The scene is therefore the smallest independently editable literary object.

Future versions may allow Experts to operate on multiple scenes simultaneously, but the scene remains the atomic unit.

Character

Characters are independent domain objects.

They are not embedded inside scenes.

Scenes reference characters.

Characters may later include:

biography
appearance
personality
relationships
goals
development arc
aliases
notes

The Character database becomes a reusable knowledge base for AI Experts.

Notes

Notes represent author knowledge.

Notes are never considered part of the manuscript.

They exist only to assist writing.

Examples:

research

timeline

ideas

worldbuilding

future scenes

AI may read Notes.

AI must never publish Notes.

Review

A Review is professional feedback.

A Review never modifies the manuscript.

It contains observations.

Possible examples:

strengths

weaknesses

confusing passages

emotional response

consistency issues

style observations

A Review is informational.

It requires the author's decision before any manuscript changes occur.

Revision

A Revision is a proposed modification of the manuscript.

Unlike a Review, a Revision contains replacement text.

The author may:

accept it,

reject it,

or edit it manually.

Revisions are suggestions.

They never become permanent automatically.

AI Expert

An AI Expert represents one professional role.

Examples include:

Editor

Critic

Reader

Future Publisher

Future Screenwriter

Future Translator

An Expert is not a language model.

An Expert is a behavioral contract implemented using one or more language models.

Experts operate on domain objects.

Experts never own domain objects.

Session

A Session represents one continuous interaction between the author and Literary Studio.

A Session includes:

current workspace

current selections

active editor

temporary UI state

future conversational context

Sessions may be restored after application restart.

Sessions are application objects rather than literary objects.

History

History records the evolution of the manuscript.

History exists to make every modification reversible.

History should eventually support:

undo

redo

comparison

restoration

version snapshots

History belongs to the project, not to individual AI Experts.

Experts never manage history directly.


---

# 6.7 Relationships Between Objects

```text
Workspace
    │
    ▼
Book
    │
    ├───────────────┐
    ▼               ▼
Chapter        Character
    │
    ▼
Scene
    │
    ├───────────────┐
    ▼               ▼
Review       Revision

Rules:

Workspace owns Books.
Books own Chapters.
Chapters own Scenes.
Scenes are edited.
Characters are referenced.
Reviews analyze.
Revisions modify.
AI Experts operate on Reviews and Revisions but never own literary objects.

## 6.8 Typical User Workflow

Literary Studio is designed around the natural workflow of writing a book.

The application assists the author throughout the entire lifecycle of the manuscript.

The workflow consists of several stages.

Idea

↓

Project Creation

↓

Planning

↓

Writing

↓

Revision

↓

Review

↓

Editing

↓

Publication Preparation

Stage 1 — Project Creation

The author creates a new Book.

Initial metadata may include:

title
genre
description
notes

At this point the manuscript may still be empty.

Stage 2 — Planning

The author creates:

chapters
scenes
characters
notes

The planning stage may be skipped.

Literary Studio never forces a particular writing methodology.

Stage 3 — Draft Writing

The author writes scenes.

Scenes may be written:

completely manually,

with AI assistance,

or using any combination of both.

The manuscript always belongs to the author.

Stage 4 — Revision

Revision improves the manuscript.

Typical Revision Experts:

Editor

Co-author

Revision produces proposed text.

Nothing changes automatically.

The author explicitly accepts or rejects every change.

Stage 5 — Review

Review evaluates the manuscript.

Typical Review Experts:

Critic

Readers

Future Publisher

Review never replaces manuscript text.

Review produces observations.

The author decides what to change.

Stage 6 — Editing

Editing is the final refinement stage.

Typical tasks:

grammar

punctuation

style

consistency

repetition

clarity

Editing usually occurs after major revisions.

Stage 7 — Publication Preparation

Future versions may support:

export

formatting

publisher packages

screenplay conversion

translation

publication metadata

6.9 Role of Artificial Intelligence

Artificial Intelligence is an assistant.

It is never the author.

The author's responsibilities include:

creating ideas,

making creative decisions,

approving revisions,

accepting reviews,

owning the final manuscript.

The AI responsibilities include:

analysis,

editing,

review,

generation of alternatives,

identification of problems,

professional recommendations.

Artificial Intelligence advises.

The author decides.

6.10 AI Expert Categories

Experts are grouped according to the kind of work they perform.

Category A

Writing Experts

Examples:

Editor

Co-author

These Experts generate Revision.

Category B

Review Experts

Examples:

Critic

Reader

These Experts generate Review.

Category C

Analytical Experts

Examples:

Character Analyst

Dialogue Analyst

Style Analyst

Continuity Analyst

These Experts analyze but do not rewrite.

Category D

Production Experts

Examples:

Translator

Publisher

Screenwriter

Formatter

These Experts prepare the manuscript for external use.

6.11 Product Philosophy

Literary Studio intentionally avoids the "one AI does everything" approach.

Instead,

many highly specialized Experts collaborate around one manuscript.

Advantages include:

predictable behavior,

clear responsibilities,

consistent quality,

better prompts,

simpler maintenance,

future scalability.

This philosophy influences every architectural decision in the project.

No component should violate it.

6.12 Product Success Criteria

Literary Studio succeeds if an author can complete an entire book without leaving the application.

The complete workflow should eventually include:

project creation,

planning,

writing,

editing,

review,

revision,

character management,

book management,

AI collaboration,

export,

publication preparation.

The application should become the author's primary creative environment rather than a supplementary AI tool.

Chapter 7 — Domain Model
====================================================
Chapter 7

Domain Model
====================================================
7.1 Purpose

The Domain Model defines every permanent business object used by Literary Studio.

This chapter is the canonical description of the application's domain.

Every future implementation (database, API, AI Bus, UI, synchronization layer) must conform to this model.

The Domain Model is technology-independent.

It does not describe React components.

It does not describe database tables.

It does not describe APIs.

It describes the business reality of Literary Studio.

7.2 Design Principles

The Domain Model follows several permanent principles.

Single Source of Truth

Every business entity exists exactly once.

No duplicated models.

No parallel representations.

Stable Identity

Every entity possesses a permanent identifier.

Identifiers never change.

Names may change.

Identifiers never do.

Explicit Ownership

Every entity has one owner.

Ownership is never ambiguous.

For example:

Workspace owns Books.

Book owns Chapters.

Chapter owns Scenes.

Explicit Relationships

Relationships are stored explicitly.

The system never relies on guessing connections.

Business First

The model describes literary concepts.

Implementation details are secondary.

7.3 Entity Hierarchy

Workspace

↓

Book

↓

Chapter

↓

Scene

↓

Review

↓

Revision

Characters exist alongside the manuscript and are referenced by scenes.

Notes exist alongside the manuscript and may reference any entity.

History records changes to every editable entity.

7.4 Workspace

Purpose

Workspace represents the currently opened project state.

Responsibilities

• stores currently loaded books

• stores current selections

• stores editor state

• stores application state

Workspace is not a literary object.

It is an application object.

Workspace never becomes part of the manuscript.

Workspace owns

Books

Selection

UI State

Temporary State

Session State

Workspace never owns

Characters directly

Scenes directly

Reviews directly

These always belong to Books.

7.5 Book

Purpose

Book represents one literary project.

Book is the primary business object.

Everything important belongs to a Book.

Book owns

Metadata

Chapters

Characters

Notes

Reviews

History

Future settings

Book never belongs to another Book.

Books are independent.

Book Identity

Book ID

Permanent.

Unique.

Never changes.

Book Metadata

Title

Description

Genre

Author

Language

Status

Creation date

Modification date

Future metadata may be added without changing the ownership model.

7.6 Chapter

Purpose

Chapter organizes scenes.

It has minimal business logic.

Chapter owns

Ordered Scenes

Chapter Identity

Permanent ID

Title

Order

Optional metadata

Chapters never contain text directly.

All manuscript text belongs to scenes.

7.7 Scene

Purpose

Scene is the atomic literary object.

Every AI operation ultimately targets one or more scenes.

Scene contains

Title

Text

Metadata

Future tags

Future references

Scene Identity

Permanent ID

Never changes.

Scene Lifecycle

Created

↓

Written

↓

Reviewed

↓

Revised

↓

Edited

↓

Completed

Future versions may support multiple revisions of the same scene.

7.8 Character

Purpose

Character represents one fictional person.

Characters exist independently of scenes.

Scenes reference characters.

Characters never own scenes.

Character contains

Name

Biography

Description

Appearance

Goals

Relationships

Aliases

Notes

Future timeline

Character Identity

Permanent ID

Character references

Scenes

Notes

Future events

7.9 Review

Purpose

Review represents professional feedback.

Review never changes the manuscript.

Review contains

Author Expert

Timestamp

Target Scene

Feedback

Future severity

Future categories

Review Lifecycle

Created

↓

Read

↓

Accepted

or

Ignored

Review never modifies Scene.

# 7.10 Revision

Purpose

Revision represents a proposed modification of the manuscript.

Unlike a Review, a Revision contains replacement content.

Revision never becomes part of the manuscript automatically.

The author must explicitly approve every Revision.

---

Revision contains

Target Scene

Original Text

Proposed Text

Author Expert

Creation Timestamp

Optional Explanation

Future Confidence Score

Future Diff Information

---

Revision Lifecycle

Generated

↓

Presented to Author

↓

Accepted

or

Rejected

↓

Archived

---

Only an accepted Revision modifies the manuscript.

Rejected Revisions remain part of project history.

---

Revision Ownership

A Revision belongs to one Scene.

A Scene may have many Revisions.

Only one Revision may be accepted at a time.

Future versions may support branching revisions.

---

# 7.11 AI Expert

Purpose

An AI Expert represents a professional role.

An Expert is a behavioral contract.

An Expert is not a language model.

The same Expert may use different models over time.

Different Experts may use the same model.

The product interacts with Experts.

Experts interact with AI providers.

---

Expert Responsibilities

Each Expert has exactly one professional responsibility.

Responsibilities must never overlap significantly.

Examples

Editor

improves language

Critic

evaluates literary quality

Reader

reports emotional response

Translator

translates

Publisher

evaluates publication readiness

---

Expert Output

Every Expert produces exactly one output category.

Current categories:

Revision

Review

Future categories:

Analysis

Metadata

Planning

Transformation

Validation

Export

Introducing a new output category requires architectural review.

---

Expert Independence

Experts do not communicate directly.

Experts never modify each other's output.

The manuscript is the only shared object.

---

Expert Identity

Each Expert has

Permanent Identifier

Display Name

Professional Role

Output Category

Supported Operations

Capabilities

Future Configuration

---

# 7.12 Notes

Purpose

Notes store author knowledge.

Notes are never considered manuscript content.

---

Notes may reference

Book

Chapter

Scene

Character

Future Timeline

Future Research

---

Notes never appear in exported manuscripts unless explicitly requested.

---

# 7.13 History

Purpose

History records the evolution of editable entities.

History guarantees recoverability.

---

History stores

Creation

Modification

Deletion

Revision Acceptance

Future Merge Operations

Future Conflict Resolution

---

History is append-only.

Historical records are never modified.

---

# 7.14 Relationships

Ownership

Workspace

owns

Books

Book

owns

Chapters

Characters

Notes

History

Chapter

owns

Scenes

Scene

owns

Reviews

Revisions

---

References

Scenes reference Characters.

Notes may reference any domain object.

Reviews reference Scenes.

Revisions reference Scenes.

History references every editable entity.

References never imply ownership.

---

# 7.15 Domain Invariants

The following rules are always true.

A Scene always belongs to exactly one Chapter.

A Chapter always belongs to exactly one Book.

A Book always belongs to exactly one Workspace.

A Review never modifies a Scene.

A Revision never becomes permanent automatically.

An AI Expert never owns domain objects.

A Character may exist without appearing in any Scene.

Notes never become part of the manuscript automatically.

History never loses information.

Identifiers never change.

Ownership never forms cycles.

The manuscript always remains under author control.

Violating any invariant is considered a defect.

7.16 Architectural Boundaries
The Domain Model never depends on:

React

Next.js

Database schema

REST API

AI Provider

LLM Vendor

Prompt implementation

Storage implementation

Synchronization implementation

Authentication provider

UI depends on Domain.

AI Bus depends on Domain.

Storage depends on Domain.

Database depends on Domain.

The Domain depends on nothing.
====================================================
7.16 Architectural Boundaries
====================================================

Purpose

Architectural Boundaries define what each layer of Literary Studio
is allowed to know about and what it must never depend on.

These rules are permanent.

Breaking them is considered an architectural defect.

----------------------------------------------------
Dependency Rule
----------------------------------------------------

                +----------------------+
                |      UI Layer        |
                +----------+-----------+
                           |
                           v
                +----------------------+
                | Workspace Controller |
                +----------+-----------+
                           |
                           v
                +----------------------+
                |      AI Bus          |
                +----------+-----------+
                           |
                           v
                +----------------------+
                |     Domain Model     |
                +----------+-----------+
                           ^
                           |
        +------------------+------------------+
        |                  |                  |
        |                  |                  |
+---------------+  +---------------+  +---------------+
|   Storage     |  |   Database    |  | Authentication|
+---------------+  +---------------+  +---------------+

----------------------------------------------------
Allowed Dependencies
----------------------------------------------------

UI depends on Domain.

Workspace Controller depends on Domain.

AI Bus depends on Domain.

Storage depends on Domain.

Database depends on Domain.

Authentication depends on Domain.

The Domain depends on nothing.

----------------------------------------------------
Forbidden Dependencies
----------------------------------------------------

The Domain Model must never depend on:

React

Next.js

Browser APIs

Storage implementation

Database implementation

REST API

AI Provider

Prompt implementation

OpenAI SDK

Anthropic SDK

Synchronization layer

Authentication provider

Deployment platform

----------------------------------------------------
Architectural Principle
----------------------------------------------------

Technology changes.

Business remains.

The Domain Model is the stable center of the system.

Everything else is replaceable.