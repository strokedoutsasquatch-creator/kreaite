import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export interface BookExportData {
  title: string;
  author: string;
  description?: string;
  chapters: { number: number; title: string; content: string }[];
  coverImageUrl?: string;
  isbn?: string;
  publishedDate?: Date;
  genre?: string;
  language?: string;
  dedication?: string;
  acknowledgments?: string;
}

export interface ExportResult {
  content: string | Buffer;
  contentType: string;
  filename: string;
}

// Generate unique ID for EPUB
function generateUUID(): string {
  return crypto.randomUUID();
}

// Escape HTML entities
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Convert markdown-like content to HTML
function contentToHtml(content: string): string {
  return content
    .split("\n\n")
    .map((paragraph) => {
      if (paragraph.startsWith("# ")) {
        return `<h1>${escapeHtml(paragraph.slice(2))}</h1>`;
      } else if (paragraph.startsWith("## ")) {
        return `<h2>${escapeHtml(paragraph.slice(3))}</h2>`;
      } else if (paragraph.startsWith("### ")) {
        return `<h3>${escapeHtml(paragraph.slice(4))}</h3>`;
      } else if (paragraph.startsWith("> ")) {
        return `<blockquote>${escapeHtml(paragraph.slice(2))}</blockquote>`;
      } else if (paragraph.startsWith("- ")) {
        const items = paragraph.split("\n").map((line) => 
          `<li>${escapeHtml(line.replace(/^- /, ""))}</li>`
        ).join("");
        return `<ul>${items}</ul>`;
      } else if (paragraph.trim()) {
        return `<p>${escapeHtml(paragraph)}</p>`;
      }
      return "";
    })
    .join("\n");
}

// Generate table of contents
export function generateTableOfContents(chapters: { number: number; title: string }[]): string {
  const items = chapters
    .map((ch) => `<li><a href="#chapter-${ch.number}">Chapter ${ch.number}: ${escapeHtml(ch.title)}</a></li>`)
    .join("\n");
  
  return `
    <nav class="toc">
      <h2>Table of Contents</h2>
      <ol>
        ${items}
      </ol>
    </nav>
  `;
}

// Generate copyright page
export function generateCopyrightPage(bookData: BookExportData): string {
  const year = bookData.publishedDate?.getFullYear() || new Date().getFullYear();
  
  return `
    <div class="copyright-page">
      <p class="title">${escapeHtml(bookData.title)}</p>
      <p class="author">by ${escapeHtml(bookData.author)}</p>
      <br/>
      <p>Copyright © ${year} ${escapeHtml(bookData.author)}</p>
      <p>All rights reserved.</p>
      ${bookData.isbn ? `<p>ISBN: ${escapeHtml(bookData.isbn)}</p>` : ""}
      <br/>
      <p>No part of this publication may be reproduced, distributed, or transmitted 
      in any form or by any means without the prior written permission of the publisher.</p>
      <br/>
      <p>Published by Stroke Recovery Academy</p>
      <p>www.strokerecoveryacademy.com</p>
    </div>
  `;
}

// Format chapter for export
export function formatChapterForExport(chapter: { number: number; title: string; content: string }): string {
  return `
    <section class="chapter" id="chapter-${chapter.number}">
      <h2 class="chapter-title">Chapter ${chapter.number}</h2>
      <h3 class="chapter-subtitle">${escapeHtml(chapter.title)}</h3>
      <div class="chapter-content">
        ${contentToHtml(chapter.content)}
      </div>
    </section>
  `;
}

// Book CSS styles
const bookStyles = `
  @page {
    size: 6in 9in;
    margin: 0.75in;
  }
  
  body {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #1a1a1a;
    max-width: 100%;
  }
  
  .title-page {
    text-align: center;
    page-break-after: always;
    padding-top: 3in;
  }
  
  .title-page .title {
    font-size: 28pt;
    font-weight: bold;
    margin-bottom: 0.5in;
  }
  
  .title-page .subtitle {
    font-size: 16pt;
    font-style: italic;
    margin-bottom: 1in;
  }
  
  .title-page .author {
    font-size: 18pt;
  }
  
  .copyright-page {
    font-size: 10pt;
    text-align: center;
    page-break-after: always;
    padding-top: 2in;
  }
  
  .dedication {
    text-align: center;
    font-style: italic;
    padding: 2in 1in;
    page-break-after: always;
  }
  
  .toc {
    page-break-after: always;
  }
  
  .toc h2 {
    text-align: center;
    margin-bottom: 1em;
  }
  
  .toc ol {
    list-style-type: none;
    padding: 0;
  }
  
  .toc li {
    margin: 0.5em 0;
  }
  
  .toc a {
    text-decoration: none;
    color: inherit;
  }
  
  .chapter {
    page-break-before: always;
  }
  
  .chapter-title {
    text-align: center;
    font-size: 14pt;
    margin-bottom: 0.25in;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  
  .chapter-subtitle {
    text-align: center;
    font-size: 18pt;
    font-weight: normal;
    font-style: italic;
    margin-bottom: 1in;
  }
  
  .chapter-content p {
    text-indent: 0.25in;
    margin: 0 0 0.5em 0;
  }
  
  .chapter-content p:first-child {
    text-indent: 0;
  }
  
  .chapter-content p:first-child::first-letter {
    font-size: 3em;
    float: left;
    line-height: 0.8;
    padding-right: 0.1em;
  }
  
  blockquote {
    font-style: italic;
    margin: 1em 2em;
    padding-left: 1em;
    border-left: 3px solid #ccc;
  }
  
  h1, h2, h3 {
    font-weight: bold;
  }
`;

// Print-ready styles for Lulu (6x9 paperback)
const printReadyStyles = `
  @page {
    size: 6in 9in;
    margin-top: 0.75in;
    margin-bottom: 0.75in;
    margin-inside: 0.875in;
    margin-outside: 0.625in;
  }
  
  @page :left {
    @bottom-left {
      content: counter(page);
    }
  }
  
  @page :right {
    @bottom-right {
      content: counter(page);
    }
  }
  
  body {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #000;
    orphans: 2;
    widows: 2;
  }
  
  .title-page {
    text-align: center;
    page-break-after: always;
    padding-top: 2.5in;
  }
  
  .title-page .title {
    font-size: 24pt;
    font-weight: bold;
    margin-bottom: 0.5in;
  }
  
  .title-page .author {
    font-size: 16pt;
    margin-top: 1in;
  }
  
  .copyright-page {
    font-size: 9pt;
    page-break-after: always;
  }
  
  .chapter {
    page-break-before: always;
  }
  
  .chapter-title {
    text-align: center;
    font-size: 12pt;
    margin-top: 2in;
    margin-bottom: 0.25in;
    text-transform: uppercase;
    letter-spacing: 0.15em;
  }
  
  .chapter-subtitle {
    text-align: center;
    font-size: 16pt;
    font-weight: normal;
    margin-bottom: 0.75in;
  }
  
  .chapter-content p {
    text-indent: 0.3in;
    margin: 0;
    text-align: justify;
  }
  
  .chapter-content p:first-child {
    text-indent: 0;
  }
`;

// Generate book as HTML (can be converted to PDF via browser print)
export function generateBookHTML(bookData: BookExportData, forPrint: boolean = false): string {
  const styles = forPrint ? printReadyStyles : bookStyles;
  
  const titlePage = `
    <div class="title-page">
      <p class="title">${escapeHtml(bookData.title)}</p>
      ${bookData.description ? `<p class="subtitle">${escapeHtml(bookData.description)}</p>` : ""}
      <p class="author">${escapeHtml(bookData.author)}</p>
    </div>
  `;
  
  const copyrightPage = generateCopyrightPage(bookData);
  
  const dedication = bookData.dedication ? `
    <div class="dedication">
      <p>${escapeHtml(bookData.dedication)}</p>
    </div>
  ` : "";
  
  const toc = generateTableOfContents(bookData.chapters);
  
  const chapters = bookData.chapters
    .map((chapter) => formatChapterForExport(chapter))
    .join("\n");
  
  return `
<!DOCTYPE html>
<html lang="${bookData.language || 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(bookData.title)} by ${escapeHtml(bookData.author)}</title>
  <style>${styles}</style>
</head>
<body>
  ${titlePage}
  ${copyrightPage}
  ${dedication}
  ${toc}
  ${chapters}
</body>
</html>
  `.trim();
}

// Generate PDF-ready HTML
export async function generateBookPDF(bookData: BookExportData): Promise<ExportResult> {
  const html = generateBookHTML(bookData, false);
  const filename = `${bookData.title.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.html`;
  
  return {
    content: html,
    contentType: "text/html",
    filename,
  };
}

// Generate print-ready PDF HTML for Lulu
export async function generatePrintReadyPDF(
  bookData: BookExportData,
  format: "paperback" | "hardcover" = "paperback"
): Promise<ExportResult> {
  const html = generateBookHTML(bookData, true);
  const filename = `${bookData.title.replace(/[^a-zA-Z0-9]/g, "_")}_print_ready_${format}_${Date.now()}.html`;
  
  return {
    content: html,
    contentType: "text/html",
    filename,
  };
}

// EPUB generation (simplified - creates XHTML content for EPUB packaging)
export async function generateBookEPUB(bookData: BookExportData): Promise<ExportResult> {
  const uuid = generateUUID();
  const language = bookData.language || "en";
  
  // OPF content (package file)
  const opfContent = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">urn:uuid:${uuid}</dc:identifier>
    <dc:title>${escapeHtml(bookData.title)}</dc:title>
    <dc:creator>${escapeHtml(bookData.author)}</dc:creator>
    <dc:language>${language}</dc:language>
    ${bookData.description ? `<dc:description>${escapeHtml(bookData.description)}</dc:description>` : ""}
    ${bookData.isbn ? `<dc:identifier id="isbn">${bookData.isbn}</dc:identifier>` : ""}
    <meta property="dcterms:modified">${new Date().toISOString().split('.')[0]}Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>
    ${bookData.chapters.map((ch) => 
      `<item id="chapter${ch.number}" href="chapter${ch.number}.xhtml" media-type="application/xhtml+xml"/>`
    ).join("\n    ")}
    <item id="css" href="styles.css" media-type="text/css"/>
  </manifest>
  <spine>
    <itemref idref="title"/>
    ${bookData.chapters.map((ch) => `<itemref idref="chapter${ch.number}"/>`).join("\n    ")}
  </spine>
</package>`;

  // Navigation document
  const navContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${language}">
<head>
  <meta charset="UTF-8"/>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      <li><a href="title.xhtml">Title Page</a></li>
      ${bookData.chapters.map((ch) => 
        `<li><a href="chapter${ch.number}.xhtml">Chapter ${ch.number}: ${escapeHtml(ch.title)}</a></li>`
      ).join("\n      ")}
    </ol>
  </nav>
</body>
</html>`;

  // Title page
  const titleContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${language}">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeHtml(bookData.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <div class="title-page">
    <h1>${escapeHtml(bookData.title)}</h1>
    ${bookData.description ? `<p class="subtitle">${escapeHtml(bookData.description)}</p>` : ""}
    <p class="author">by ${escapeHtml(bookData.author)}</p>
  </div>
</body>
</html>`;

  // Chapter files content
  const chapterContents = bookData.chapters.map((ch) => ({
    filename: `chapter${ch.number}.xhtml`,
    content: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="${language}">
<head>
  <meta charset="UTF-8"/>
  <title>Chapter ${ch.number}: ${escapeHtml(ch.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <section class="chapter">
    <h2>Chapter ${ch.number}</h2>
    <h3>${escapeHtml(ch.title)}</h3>
    <div class="chapter-content">
      ${contentToHtml(ch.content)}
    </div>
  </section>
</body>
</html>`
  }));

  // CSS styles
  const cssContent = `
body {
  font-family: Georgia, serif;
  font-size: 1em;
  line-height: 1.6;
  margin: 1em;
}

.title-page {
  text-align: center;
  margin-top: 3em;
}

.title-page h1 {
  font-size: 2em;
  margin-bottom: 0.5em;
}

.title-page .subtitle {
  font-style: italic;
  margin-bottom: 2em;
}

.title-page .author {
  font-size: 1.2em;
}

.chapter h2 {
  text-align: center;
  font-size: 1em;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 2em;
}

.chapter h3 {
  text-align: center;
  font-size: 1.3em;
  font-weight: normal;
  font-style: italic;
  margin-bottom: 2em;
}

.chapter-content p {
  text-indent: 1.5em;
  margin: 0 0 0.5em 0;
}

.chapter-content p:first-child {
  text-indent: 0;
}

blockquote {
  font-style: italic;
  margin: 1em 2em;
  padding-left: 1em;
  border-left: 3px solid #ccc;
}
`;

  // Container XML
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

  // Return EPUB structure as JSON (to be assembled into ZIP on client or with a ZIP library)
  const epubStructure = {
    "mimetype": "application/epub+zip",
    "META-INF/container.xml": containerXml,
    "OEBPS/content.opf": opfContent,
    "OEBPS/nav.xhtml": navContent,
    "OEBPS/title.xhtml": titleContent,
    "OEBPS/styles.css": cssContent,
    ...Object.fromEntries(chapterContents.map((ch) => [`OEBPS/${ch.filename}`, ch.content])),
  };

  const filename = `${bookData.title.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.epub.json`;
  
  return {
    content: JSON.stringify(epubStructure, null, 2),
    contentType: "application/json",
    filename,
  };
}

// Estimate page count for print
export function estimatePageCount(bookData: BookExportData): number {
  const totalWords = bookData.chapters.reduce((sum, ch) => {
    return sum + ch.content.split(/\s+/).length;
  }, 0);
  
  // Approximately 250 words per page for a 6x9 book
  const contentPages = Math.ceil(totalWords / 250);
  
  // Add front matter (title, copyright, dedication, TOC)
  const frontMatter = 4 + (bookData.dedication ? 1 : 0);
  
  return contentPages + frontMatter;
}

// Calculate word count
export function calculateWordCount(bookData: BookExportData): number {
  return bookData.chapters.reduce((sum, ch) => {
    return sum + ch.content.split(/\s+/).filter(w => w.length > 0).length;
  }, 0);
}

// Validate book data for export
export function validateBookForExport(bookData: BookExportData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!bookData.title?.trim()) {
    errors.push("Book title is required");
  }
  
  if (!bookData.author?.trim()) {
    errors.push("Author name is required");
  }
  
  if (!bookData.chapters || bookData.chapters.length === 0) {
    errors.push("At least one chapter is required");
  }
  
  bookData.chapters?.forEach((ch, index) => {
    if (!ch.title?.trim()) {
      errors.push(`Chapter ${index + 1} is missing a title`);
    }
    if (!ch.content?.trim()) {
      errors.push(`Chapter ${index + 1} has no content`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
