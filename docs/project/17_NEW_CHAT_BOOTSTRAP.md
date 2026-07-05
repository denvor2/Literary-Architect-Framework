# Literary Studio — New Chat Bootstrap

**Version:** 1.0

**Repository**

https://github.com/denvor2/Literary-Architect-Framework

**Branch**

main

---

# Цель

Этот документ является единственной точкой входа для нового чата ChatGPT.

После прочтения перечисленных ниже документов новый чат должен иметь возможность продолжить проект без повторного проектирования, потери архитектуры или дублирования работы.

---

# Порядок чтения

## 1. Общие документы

1. CLAUDE.md
   https://github.com/denvor2/Literary-Architect-Framework/blob/main/CLAUDE.md

2. README.md
   https://github.com/denvor2/Literary-Architect-Framework/blob/main/README.md

---

## 2. Документы проекта

- PROJECT_CHARTER.md
- PROJECT_STATE.md
- CURRENT_SPRINT.md
- CURRENT_STEP.md
- BACKLOG.md

https://github.com/denvor2/Literary-Architect-Framework/tree/main/docs/project

---

## 3. AI Bus

10_AI_BUS_WORKFLOW.md

---

## 4. Архитектура

11_CURRENT_STATE.md

12_DOMAIN_MODEL.md

13_COMPONENT_MAP.md

14_BACKEND_API.md

15_MASTER_INDEX.md

16_CHAT_HANDOVER.md

---

## 5. Product

PRODUCT_VISION.md

DOMAIN_MODEL.md

EXPERT_CATALOG.md

BOOK_LIFECYCLE.md

MVP_SCOPE.md

USER_MODEL.md

---

## 6. ADR

ADR-0001

ADR-0002

ADR-0003

---

## 7. Sprint Reports

SPRINT-03

SPRINT-04

---

# Текущее состояние проекта

Проект находится после завершения Sprint 06.

Реализовано:

- Domain Layer
- Workspace Controller
- Storage Layer
- AI Bus v5
- AI Contracts
- чистая композиция UI
- архитектура готова к дальнейшему развитию

Следующий крупный этап:

1. Documentation Cleanup
2. Architecture Ratification
3. Sprint 07

---

# AI Bus

Рабочий процесс:

Product Owner

↓

Chief Software Architect (ChatGPT)

↓

Claude Code

↓

ARP Report

↓

Architecture Review

↓

Следующий шаг

Claude никогда не начинает следующий шаг без подтверждения архитектора.

---

# Основные правила

- Не нарушать ADR.
- Не нарушать PROJECT_CHARTER.
- Не менять пользовательское поведение без утвержденного Sprint.
- Все ответы Claude — только в формате ARP.
- При обнаружении противоречий сообщать о них явно, а не подгонять решение.

---

# Первый запрос новому чату

Прочитай все документы в указанном порядке.

После чтения сообщи:

1. Где находится проект сейчас.
2. Что уже реализовано.
3. Какие архитектурные ограничения действуют.
4. Какие открытые вопросы существуют.
5. Какой следующий Sprint предлагается выполнить.

Не начинай разработку, пока не сформируешь собственное понимание проекта.

После этого продолжаем работу.