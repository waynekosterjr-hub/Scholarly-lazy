import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, PageBreak } from 'docx';
import { ScholarlyPaper, CitationStyle } from '../types';
import { formatFullReference } from './citationFormatter';

export interface DocxExportOptions {
  title: string;
  authorName?: string;
  institution?: string;
  courseName?: string;
  instructorName?: string;
  dateStr?: string;
  content: string;
  references: ScholarlyPaper[];
  citationStyle: CitationStyle;
  includeTitlePage?: boolean;
}

export async function generateDocxBlob(options: DocxExportOptions): Promise<Blob> {
  const {
    title,
    authorName = 'Student Author',
    institution = 'Academic Institution',
    courseName = 'Course Assignment',
    instructorName = 'Professor / Instructor',
    dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    content,
    references,
    citationStyle = 'APA7',
    includeTitlePage = true,
  } = options;

  const paragraphs: Paragraph[] = [];

  // 1. APA Title Page (if enabled)
  if (includeTitlePage) {
    paragraphs.push(
      new Paragraph({
        text: '',
        spacing: { before: 2400 }, // Push down to upper third
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 24, // 12pt
            font: 'Times New Roman',
          }),
        ],
        spacing: { after: 400 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: authorName,
            size: 24,
            font: 'Times New Roman',
          }),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: institution,
            size: 24,
            font: 'Times New Roman',
          }),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: courseName,
            size: 24,
            font: 'Times New Roman',
          }),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: instructorName,
            size: 24,
            font: 'Times New Roman',
          }),
        ],
        spacing: { after: 200 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: dateStr,
            size: 24,
            font: 'Times New Roman',
          }),
        ],
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [new PageBreak()],
      })
    );
  }

  // 3. Process Content Lines & Handle Title & Page Breaks
  const lines = content.split('\n');
  let firstHeadingFound = false;

  // Check if content already starts with an H1 title
  const firstNonEmpty = lines.find((l) => l.trim().length > 0)?.trim() || '';
  const contentHasMainTitle = firstNonEmpty.startsWith('# ') && !firstNonEmpty.startsWith('## ');

  // 2. Main Content Heading (only if content doesn't already provide its own # H1 title)
  if (!contentHasMainTitle) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 24,
            font: 'Times New Roman',
          }),
        ],
        spacing: { after: 300 },
      })
    );
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    // Check for explicit or manual page break markers (convert to real Word PageBreak instead of text)
    if (
      trimmed.match(/^[-—=*_~#\s]*page\s*break[-—=*_~#\s]*$/i) ||
      trimmed === '---' ||
      trimmed === '***' ||
      trimmed === '===' ||
      trimmed === '---pagebreak---' ||
      trimmed === '\f'
    ) {
      paragraphs.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
      continue;
    }

    // Check if line is a Heading 1 (# Heading)
    if (trimmed.startsWith('# ') && !trimmed.startsWith('## ')) {
      const headingText = trimmed.replace(/^#\s+/, '');
      // If this is the very first H1, center it as the main title
      const isFirst = !firstHeadingFound;
      firstHeadingFound = true;

      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: isFirst ? AlignmentType.CENTER : AlignmentType.LEFT,
          children: [
            new TextRun({
              text: headingText,
              bold: true,
              size: 24,
              font: 'Times New Roman',
            }),
          ],
          spacing: { before: isFirst ? 0 : 300, after: 200 },
        })
      );
    } else if (trimmed.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: trimmed.replace(/^##\s+/, ''),
              bold: true,
              size: 24,
              font: 'Times New Roman',
            }),
          ],
          spacing: { before: 240, after: 150 },
        })
      );
    } else if (trimmed.startsWith('### ')) {
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: trimmed.replace(/^###\s+/, ''),
              bold: true,
              italics: true,
              size: 24,
              font: 'Times New Roman',
            }),
          ],
          spacing: { before: 200, after: 100 },
        })
      );
    } else {
      // Standard Academic Paragraph (0.5 inch first-line indent, double-spaced)
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: {
            firstLine: 720, // 0.5 inch indent (1440 dxa = 1 inch, 720 = 0.5 inch)
          },
          spacing: {
            line: 480, // Double line spacing
            after: 0,
          },
          children: [
            new TextRun({
              text: trimmed,
              size: 24, // 12pt
              font: 'Times New Roman',
            }),
          ],
        })
      );
    }
  }

  // 4. References Page Break and References Section
  if (references.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [new PageBreak()],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: citationStyle === 'MLA9' ? 'Works Cited' : 'References',
            bold: true,
            size: 24,
            font: 'Times New Roman',
          }),
        ],
        spacing: { after: 300 },
      })
    );

    // Alphabetize references
    const sortedRefs = [...references].sort((a, b) => {
      const authA = (a.authors?.[0]?.name || a.title).toLowerCase();
      const authB = (b.authors?.[0]?.name || b.title).toLowerCase();
      return authA.localeCompare(authB);
    });

    sortedRefs.forEach((paper, idx) => {
      const refFormatted = formatFullReference(paper, citationStyle, idx);
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          indent: {
            left: 720, // 0.5 inch hanging indent
            hanging: 720,
          },
          spacing: {
            line: 480, // Double spacing
            after: 240,
          },
          children: [
            new TextRun({
              text: refFormatted,
              size: 24,
              font: 'Times New Roman',
            }),
          ],
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch = 1440 dxa
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
