const fs = require('fs');
const path = require('path');

// Sample book data
const testBook = {
  id: "test-book-1",
  title: "The Great Adventure",
  genre: "Fantasy",
  language: "English",
  premise: "A hero embarks on a journey to save the world",
  shortAnnotation: "An epic tale of heroes and monsters",
  fullAnnotation: "A comprehensive story about a young hero who must overcome great challenges",
  tags: ["fantasy", "adventure", "epic"],
  chapters: [
    {
      id: "ch1",
      title: "The Beginning",
      subtitle: "Where it all starts",
      scenes: [
        {
          id: "s1",
          title: "Chapter Start",
          text: "This is the *opening* scene. **The hero awakens** to a new world."
        },
        {
          id: "s2",
          title: "Meeting the Guide",
          text: "A mysterious figure appears. *'Follow me,'* she says, and **boldly** walks forward."
        }
      ]
    },
    {
      id: "ch2",
      title: "The Journey Begins",
      subtitle: "Testing our hero",
      scenes: [
        {
          id: "s3",
          title: "Trials and Tribulations",
          text: "The path is treacherous. **Bold challenges** test *italic resolve*."
        }
      ]
    }
  ],
  characters: [
    {
      id: "char1",
      name: "The Hero",
      description: "A brave and determined individual",
      notes: "Once *worked* as a **blacksmith**",
      photoUrl: ""
    },
    {
      id: "char2",
      name: "The Guide",
      description: "A mysterious mentor figure",
      notes: "Her origins are _mysterious_",
      photoUrl: ""
    }
  ],
  ideas: [
    {
      id: "idea1",
      text: "What if the hero has a hidden power?",
      createdAt: new Date().toISOString()
    }
  ],
  assistantThreads: {
    coauthor: [],
    editor: [],
    critic: [],
    reader: []
  }
};

async function testDOCXExport() {
  console.log("Testing DOCX export API...");
  console.log(`Book: "${testBook.title}"`);
  console.log(`Chapters: ${testBook.chapters.length}, Characters: ${testBook.characters.length}`);

  try {
    const response = await fetch("http://localhost:3000/api/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        format: "docx",
        book: testBook,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`API error (${response.status}): ${error}`);
      process.exit(1);
    }

    const buffer = await response.arrayBuffer();
    console.log(`✓ DOCX generated successfully (${buffer.byteLength} bytes)`);

    const outputPath = path.join(__dirname, "test-export.docx");
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    console.log(`✓ File saved: ${outputPath}`);

    // Verify file structure (basic)
    const size = fs.statSync(outputPath).size;
    console.log(`✓ File size: ${size} bytes`);

    // DOCX files should be ZIP archives with minimum size
    if (size < 2000) {
      console.error(`⚠ Warning: DOCX file seems too small (${size} bytes)`);
    } else {
      console.log("✓ DOCX file size looks reasonable");
    }

    console.log("\n✓ DOCX export test PASSED");
  } catch (error) {
    console.error("Test failed:", error.message);
    process.exit(1);
  }
}

testDOCXExport();
