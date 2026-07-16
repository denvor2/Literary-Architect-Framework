# Hybrid Archive Format

## Overview

The Hybrid Archive format (`markdown-zip`) enables project backup, transfer between machines, and future import functionality. It combines structured JSON metadata with human-readable Markdown content.

## Archive Structure

```
book-project_2026-07-16_14-30-45.zip
├── metadata.json          # Project structure and export info
├── book.json              # Complete book data (for import)
├── chapters/              # Markdown files for each chapter
│   ├── 01-chapter-one.md
│   ├── 02-chapter-two.md
├── characters/            # Markdown profile for each character
│   ├── main-character.md
│   ├── antagonist.md
└── ideas/                 # Markdown file for each idea
    ├── 01-2026-07-16.md
    ├── 02-2026-07-16.md
```

## File Descriptions

### metadata.json

Structured metadata for parsing and validation:

```json
{
  "version": "1.0",
  "exportDate": "2026-07-16T14:30:45.123Z",
  "book": {
    "id": "book-uuid-123",
    "title": "My Story",
    "genre": "Fantasy",
    "language": "en",
    "premise": "A hero's journey...",
    "shortAnnotation": "Short summary",
    "fullAnnotation": "Full synopsis",
    "tags": ["adventure", "epic"],
    "seriesId": "series-uuid-456"
  },
  "series": {
    "id": "series-uuid-456",
    "title": "Chronicles"
  },
  "structure": {
    "chapters": [
      {
        "id": "chapter-uuid-1",
        "title": "Chapter One",
        "order": 1,
        "sceneCount": 3
      }
    ],
    "characterCount": 12,
    "ideaCount": 5
  }
}
```

### book.json

Complete book object with all nested data:

```json
{
  "id": "book-uuid-123",
  "title": "My Story",
  "chapters": [
    {
      "id": "chapter-uuid-1",
      "title": "Chapter One",
      "subtitle": "The Beginning",
      "scenes": [
        {
          "id": "scene-uuid-1",
          "title": "Scene Title",
          "text": "Scene content..."
        }
      ]
    }
  ],
  "characters": [
    {
      "id": "char-uuid-1",
      "name": "Alice",
      "description": "A brave hero...",
      "photoUrl": "https://...",
      "notes": "Character notes..."
    }
  ],
  "ideas": [
    {
      "id": "idea-uuid-1",
      "text": "An interesting plot twist...",
      "createdAt": "2026-07-16T14:00:00Z"
    }
  ]
}
```

### chapters/*.md

Full chapter text with scene structure:

```markdown
# Chapter 01: The Beginning

*Subtitle if present*

## First Scene

Scene text content...

---

## Second Scene

More scene content...
```

### characters/*.md

Character profile (name-based filename):

```markdown
# Alice

![Alice](https://photo-url)

## Description

Character description and appearance...

## Notes

Additional character development notes...
```

### ideas/*.md

Individual idea with creation date:

```markdown
# Idea — 2026-07-16

The plot twist text content...
```

## Filename Format

All exported files use timestamped naming:

```
{title}_{YYYY-MM-DD}_{HH-MM-SS}.{ext}
```

Example:
- `my-story_2026-07-16_14-30-45.zip`
- `chronicle-one_2026-07-15_09-15-22.docx`
- `novel-draft_2026-07-14_18-45-33.pdf`

## Use Cases

### Local Backup
Save your project state with a timestamped archive:
1. File → Save As (Сохранить как)
2. Choose "Markdown ZIP архив"
3. Archive saved to Downloads folder with date-time

### Transfer Between Machines
1. Export on machine A → transfer file
2. On machine B: Future import feature (coming Sprint-37+)
3. Complete project restored

### Version Control
ZIP archives can be committed to git with timestamps to track project evolution:
- `novel_2026-07-01_initial-draft.zip`
- `novel_2026-07-08_post-revision.zip`
- `novel_2026-07-15_final-for-publishing.zip`

### Manual Inspection
Extract archive on any machine to:
- Read chapters as plain text
- Audit character profiles
- Review project structure via metadata.json

## Future: Import Feature

Planned for Sprint-37+:

```
File → Open from Archive
```

Will:
1. Read `metadata.json` for structure validation
2. Load `book.json` into domain model
3. Restore all chapters, characters, ideas in correct hierarchy
4. Start editing immediately with full project state

## Implementation Details

### Encoding
- JSON files: UTF-8 with 2-space indentation
- Markdown files: UTF-8, GitHub-flavored syntax
- ZIP compression: deflate (standard)

### Filename Sanitization
- Lowercase conversion
- Cyrillic characters preserved
- Spaces/special chars → hyphens
- Multiple hyphens → single hyphen
- Leading/trailing hyphens removed

### Character Filenames
File names based on character name (sanitized):
- "Alice" → `alice.md`
- "Иван" → `иван.md` (Cyrillic preserved)
- "Mary-Jane" → `mary-jane.md`

### Chapter Ordering
Chapters numbered with zero-padding:
- Chapter 1 → `01-chapter-one.md`
- Chapter 10 → `10-chapter-ten.md`
- Chapter 100 → `100-chapter-hundred.md`

## Limits

Current implementation handles:
- ✅ Books with unlimited chapters
- ✅ Chapters with unlimited scenes
- ✅ Unlimited characters
- ✅ Unlimited ideas
- ✅ Series association
- ✅ Cyrillic character names and titles

## Validation

After export:
1. Archive should be readable with any ZIP tool
2. All JSON files should be valid (use `jq` or JSON validator)
3. Markdown files should render correctly
4. File count should match: chapters + characters + ideas + 2 (metadata + book JSON)

## Troubleshooting

**Archive won't extract:**
- Try different ZIP tool (7-Zip, WinRAR, etc.)
- Check file permissions
- Verify file is not truncated

**JSON parsing errors:**
- Ensure UTF-8 encoding
- Check for unescaped quotes in content
- Validate with online JSON validator

**Missing chapters/characters:**
- Verify they were visible in UI before export
- Check `structure.json` for expected count
- Inspect `book.json` for complete data
