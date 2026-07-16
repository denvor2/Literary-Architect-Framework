# Export Formats Guide

Literary Studio supports exporting your book in four different formats, each optimized for specific use cases.

## 1. Markdown ZIP Archive 🗂️

**Format:** `hybrid-archive`  
**File Extension:** `.zip`  
**Best For:** Project backup, transfer between machines, version control

### What's Inside

```
book-title_2026-07-16_14-30-45.zip
├── metadata.json       # Project structure and metadata
├── book.json          # Complete book data (importable)
├── chapters/          # Chapter content as MD files
├── characters/        # Character profiles
└── ideas/            # Ideas/notes
```

### Features

- ✅ Human-readable Markdown files
- ✅ Structured JSON metadata
- ✅ All book elements included
- ✅ Importable back into Literary Studio (future feature)
- ✅ Git-friendly (can commit to version control)
- ✅ Extractable with any ZIP tool

### Use Cases

```
Save As → Markdown ZIP Archive
  → Local backup with timestamp
  → Transfer to another machine
  → Archive multiple versions
  → Inspect project structure manually
```

See [HYBRID_ARCHIVE_FORMAT.md](HYBRID_ARCHIVE_FORMAT.md) for detailed structure.

---

## 2. DOCX (Word Document) 📄

**Format:** `docx`  
**File Extension:** `.docx`  
**Best For:** Editing, sharing, publishing preparation

### What's Included

- Full book text with chapters and scenes
- Character profiles and descriptions
- Word count statistics
- Metadata (genre, language, tags)
- Professional formatting

### Features

- ✅ Editable in Microsoft Word, Google Docs, LibreOffice
- ✅ Maintains text formatting (bold, italics, etc.)
- ✅ Professional typography
- ✅ Page breaks between chapters
- ✅ Table of contents ready for generation

### Limitations

- ✗ Ideas/notes not included in main text
- ✗ Cannot be directly imported back (one-way export)
- ✗ Limited to text content (no images embedded)

### Use Cases

```
Save As → DOCX (Word документ)
  → Send to editor for review
  → Polish formatting for publishing
  → Share with collaborators
  → Convert to other formats (via Word)
```

---

## 3. PDF (Professional Document) 📕

**Format:** `pdf`  
**File Extension:** `.pdf`  
**Best For:** Reading, printing, distribution, final review

### What's Included

- Complete book with all chapters
- Table of contents
- Character profiles
- Metadata page (genre, word count, tags)
- Page numbers
- Professional formatting

### Features

- ✅ Read on any device
- ✅ Print-ready (A4 format, proper margins)
- ✅ Automatically paginated
- ✅ Professional typography with justification
- ✅ Suitable for e-book conversion tools
- ✅ Searchable text

### Technical Details

- **Page Size:** A4 (210×297mm)
- **Margins:** 50pt (≈1.8cm) on all sides
- **Fonts:** Helvetica family (widely supported)
- **Text Rendering:** Justified alignment for body text
- **Page Numbers:** Bottom center, every page

### Content Structure

```
[Title Page]
- Book title (32pt)
- Genre, language, word count, tags

[Metadata Page]
- Premise (if present)
- Short annotation (if present)
- Full annotation (if present)

[Table of Contents]
- Chapter list with scene breakdown
- Scene word counts

[Content Pages]
- All chapters with scenes
- Scene titles as headings (13pt)
- Proper paragraph breaks
- Scene separators (horizontal lines)

[Character Section]
- Character name (13pt)
- Description
- Notes

[Throughout]
- Page numbers centered at bottom
```

### Use Cases

```
Save As → PDF (Портативный документ)
  → Final proof reading on any device
  → Print draft for editing
  → Share with beta readers
  → Post on website
  → Archive stable version
```

---

## 4. FB2 (E-Book Format) 📱

**Format:** `fb2`  
**File Extension:** `.fb2`  
**Best For:** E-readers, e-book publishing, device distribution

### What's Included

- Complete book structure
- All chapter and scene content
- Character profiles
- Metadata (title, author, genre, date)
- Annotations

### Supported Genres

FB2 uses standardized genre codes:

| User Genre      | FB2 Code     | E-Reader Category  |
| --------------- | ------------ | ------------------ |
| Fantasy         | sf_fantasy   | Science Fiction    |
| Science Fiction | sf_science   | Science Fiction    |
| Mystery         | det_classic  | Detective          |
| Thriller        | thriller     | Thriller           |
| Action          | sf_action    | Action             |
| Adventure       | sf_adventure | Adventure          |
| Romance         | love         | Romance            |
| Historical      | historical   | Historical Fiction |
| Fiction         | sf           | Science Fiction    |

### Features

- ✅ Standard e-book format
- ✅ Supported by most e-readers (Kindle, Kobo, etc.)
- ✅ Proper hierarchical structure
- ✅ Reflowable text (adapts to screen size)
- ✅ Built-in genre metadata
- ✅ UTF-8 encoded

### FB2 Reader Support

**Excellent:**

- FBReader (all platforms)
- Kindle (via calibre conversion)
- Kobo e-readers (some versions)

**Good:**

- Aldiko (Android)
- Bookmate (online reader)
- Moon+ Reader (Android)

**Via Conversion:**

- Apple Books (using calibre)
- Google Play Books (via conversion)

### XML Structure

FB2 files are XML documents with this structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0">
  <description>
    <title-info>
      <book-title>Your Book Title</book-title>
      <author>...</author>
      <genres><genre>...</genre></genres>
      <annotation>...</annotation>
    </title-info>
  </description>
  <body>
    <section><!-- Chapters --></section>
  </body>
</FictionBook>
```

### Use Cases

```
Save As → FB2 (E-book формат)
  → Send to e-reader device
  → Publish on FictionBook.ru
  → Convert to EPUB/MOBI (using calibre)
  → Distribute via e-book platforms
  → Archive with proper metadata
```

---

## Format Comparison

| Feature                   |     ZIP     |  DOCX  |  PDF  |      FB2       |
| ------------------------- | :---------: | :----: | :---: | :------------: |
| **Editable**              |     ❌      |   ✅   |  ❌   |       ❌       |
| **Readable Anywhere**     |     ✅      |   ✅   |  ✅   | ⚠️ (e-readers) |
| **Print-Ready**           |     ❌      |   ✅   |  ✅   |       ❌       |
| **Importable**            | ✅ (future) |   ❌   |  ❌   |       ❌       |
| **E-Reader Compatible**   |     ❌      |   ❌   |  ✅   |       ✅       |
| **Human-Readable Source** |     ✅      |   ❌   |  ❌   |    ✅ (XML)    |
| **Ideas/Notes Included**  |     ✅      |   ❌   |  ❌   |       ❌       |
| **Metadata Included**     |     ✅      |   ✅   |  ✅   |       ✅       |
| **File Size**             |    Small    | Medium | Large |     Small      |

---

## Export Workflow

### Basic Export

1. **Open your book**
2. **File → Сохранить как (Save As)**
3. **Choose format** from dialog
4. **Click "Экспорт" (Export)**
5. **File downloads** with timestamp: `title_YYYY-MM-DD_HH-MM-SS.ext`

### Filename Format

All exports use timestamps for versioning:

```
my-book_2026-07-16_14-30-45.zip
my-novel_2026-07-16_14-30-45.docx
my-story_2026-07-16_14-30-45.pdf
my-tale_2026-07-16_14-30-45.fb2
```

This allows you to:

- Keep multiple versions
- Track when each export was created
- Organize by date in your file system

---

## Conversion Between Formats

### ZIP to Other Formats

The hybrid archive can be used with conversion tools:

```bash
# Extract archive
unzip book_2026-07-16.zip

# Read metadata.json and book.json
jq . metadata.json

# MD files can be converted:
pandoc chapters/01-*.md -o book.docx
```

### DOCX to PDF

**Using Microsoft Word:**

1. Open .docx file
2. File → Print → Print to PDF

**Using LibreOffice:**

1. Open .docx file
2. File → Export as PDF

### FB2 to Other Formats

**Using Calibre (recommended):**

```bash
ebook-convert book.fb2 book.epub
ebook-convert book.fb2 book.mobi
ebook-convert book.fb2 book.pdf
```

---

## Troubleshooting

### PDF Export Issues

**Problem:** PDF file is empty or corrupted  
**Solution:** Ensure book has chapters with text content

**Problem:** Missing page numbers  
**Solution:** Check PDF reader settings (may be hidden)

**Problem:** Fonts look wrong  
**Solution:** This is normal (Helvetica substitution), fonts render correctly on most systems

### FB2 Export Issues

**Problem:** E-reader doesn't recognize file  
**Solution:** Convert via Calibre or use FBReader app

**Problem:** Cyrillic characters show as boxes  
**Solution:** Ensure your e-reader supports UTF-8 (most modern ones do)

**Problem:** Genre not recognized  
**Solution:** FB2 uses standard codes; custom genres are mapped to nearest match

### ZIP Archive Issues

**Problem:** Can't extract archive  
**Solution:** Try different ZIP tool (WinRAR, 7-Zip, etc.)

**Problem:** JSON files won't parse  
**Solution:** Use online JSON validator or `jq` command-line tool

---

## Best Practices

### For Different Use Cases

**Editing & Collaboration:**

- Export as DOCX
- Share with editors/collaborators
- Collect feedback in Word
- Import changes back to Literary Studio

**Publishing Preparation:**

- Export as PDF for formatting review
- Export as DOCX for final edits
- Use DOCX as source for publisher

**E-Book Distribution:**

- Export as FB2 for FictionBook platforms
- Convert to EPUB/MOBI using Calibre
- Distribute via Amazon KDP, Smashwords, etc.

**Backup & Version Control:**

- Export as ZIP archive regularly
- Commit archives to git with timestamps
- Maintain offline backups

**Long-Term Archiving:**

- ZIP archive (metadata preserved)
- PDF (professional formatting)
- FB2 (standard format)

### Naming Convention

Use consistent naming for exports:

```
{project}-{version}-{date}.{ext}

Examples:
my-novel-draft-1-2026-07-16.docx
my-story-final-2026-07-20.pdf
my-book-v2-2026-08-01.zip
```

---

## Future Features

- **Import:** Restore projects from ZIP archives
- **Templates:** Custom PDF styling (fonts, colors, margins)
- **EPUB Export:** Modern e-book standard
- **HTML Export:** Web-ready format
- **Audio Export:** Synthesis of book to MP3/AAC
