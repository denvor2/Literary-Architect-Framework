# 08. Architecture Decisions

## Назначение

Документ фиксирует архитектурные решения проекта.

## Главные принципы

-   Эволюционная архитектура.
-   Один источник истины.
-   Минимальные изменения.

## Слои

UI → Workspace Controller → Domain → AI Bus → API → AI Provider.

## Domain

Book, Chapter, Scene, Character, Workspace.

## AI Bus

Весь доступ к ИИ только через aiBus.

## Storage

Только workspaceStorage работает с localStorage.

## Правила

Каждый спринт сопровождается build/lint/runtime и ARP.
