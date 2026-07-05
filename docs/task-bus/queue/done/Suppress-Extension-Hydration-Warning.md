id: Suppress-Extension-Hydration-Warning
name: "Подавить hydration warning от браузерных расширений (suppressHydrationWarning на <html>)"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/app/layout.tsx

Forbidden paths:
- всё остальное

## Objective

Браузерные расширения (например, криптокошельки вроде Bybit) вставляют
атрибуты в тег <html> (data-bybit-channel-name и т.п.) до того, как
React гидратирует страницу — это вызывает безобидное, но пугающее
предупреждение Next.js о рассинхронизации SSR/client HTML. Это не
баг приложения — сам Next.js документирует suppressHydrationWarning
именно для этого случая (расширения, меняющие DOM до гидратации).

Добавить проп suppressHydrationWarning={true} на тег <html> в
src/app/layout.tsx (RootLayout), рядом с уже существующими
lang="en" и className.

Это подавляет warning ТОЛЬКО для несовпадений атрибутов на этом
конкретном элементе (html) — не отключает hydration-проверки во всём
приложении и не маскирует настоящие баги гидратации в остальном
дереве компонентов. Это официально документированный Next.js/React
паттерн именно для этого случая, а не обход проблемы.

## Rules

- Минимальное изменение — один проп на одном элементе.
- Не трогай остальной layout.tsx.
- Не добавляй suppressHydrationWarning ни на один другой элемент —
  только на <html>.

## Validation

- npm run build / npm run lint — чисто.
- Живая проверка: открыть приложение в браузере с включённым
  расширением-кошельком (или любым другим, вставляющим атрибуты в
  <html>) — предупреждение о hydration mismatch по data-* атрибутам
  на <html> больше не появляется. Опиши в ARP, как проверил (если
  расширения нет под рукой — можно вручную вставить произвольный
  data-атрибут на <html> через DevTools до загрузки React и
  убедиться, что warning не всплывает).
- Приложи изменённый файл целиком.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
