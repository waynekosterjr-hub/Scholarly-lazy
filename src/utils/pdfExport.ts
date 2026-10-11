import PDFDocument from 'pdfkit';
import { ExportOptions, layoutDocument } from './documentLayout';
import { parseInlineMarkdown } from './markdown';

type Piece = { text: string; bold?: boolean; italics?: boolean };
const font = (piece: Piece) => piece.bold ? (piece.italics ? 'Times-BoldItalic' : 'Times-Bold') : piece.italics ? 'Times-Italic' : 'Times-Roman';

// Draw measured lines so spacing, heading placement and hanging indents are deterministic.
export async function generatePdf(options: ExportOptions): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'LETTER', margin: 72, bufferPages: true, info: { Title: options.title, Author: options.authorName || '' } });
  const chunks: Buffer[] = [];
  const complete = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
  let y = 72;
  const newPage = () => { doc.addPage(); y = 72; };
  const measure = (piece: Piece) => doc.font(font(piece)).fontSize(12).widthOfString(piece.text);
  function paragraph(text: string, settings: { bold?: boolean; italics?: boolean; center?: boolean; firstIndent?: number; hanging?: boolean; heading?: boolean } = {}) {
    const pieces = parseInlineMarkdown(text).flatMap(run => (run.text.match(/\S+|\s+/g) || []).map(text => ({ ...run, text, bold: settings.bold || run.bold, italics: settings.italics || run.italics })));
    const lines: Piece[][] = [];
    let line: Piece[] = [];
    let width = 0;
    const available = () => 468 - (lines.length === 0 ? settings.firstIndent || 0 : settings.hanging ? 36 : 0);
    const push = () => { while (line.length && /^\s+$/.test(line.at(-1)!.text)) line.pop(); lines.push(line); line = []; width = 0; };
    for (const piece of pieces) {
      if (/^\s+$/.test(piece.text) && !line.length) continue;
      if (line.length && width + measure(piece) > available()) push();
      if (/^\s+$/.test(piece.text) && !line.length) continue;
      // Long URLs must wrap within the page rather than run into the margin.
      if (measure(piece) > available()) {
        for (const char of piece.text) {
          const part = { ...piece, text: char };
          if (line.length && width + measure(part) > available()) push();
          line.push(part); width += measure(part);
        }
      } else { line.push(piece); width += measure(piece); }
    }
    if (line.length) push();
    const minimum = settings.heading ? lines.length + 2 : Math.min(2, lines.length);
    if (y + minimum * 24 > 720 && y > 72) newPage();
    lines.forEach((parts, index) => {
      if (y + 24 > 720 || (lines.length - index === 2 && y + 48 > 720)) newPage();
      const indent = index === 0 ? settings.firstIndent || 0 : settings.hanging ? 36 : 0;
      let x = settings.center ? 72 + (468 - parts.reduce((sum, part) => sum + measure(part), 0)) / 2 : 72 + indent;
      for (const part of parts) {
        doc.font(font(part)).fontSize(12).text(part.text, x, y, { lineBreak: false });
        x += measure(part);
      }
      y += 24;
    });
  }
  if (options.includeTitlePage !== false) {
    y = 144;
    paragraph(options.title, { bold: true, center: true });
    y += 24;
    [options.authorName, options.institution, options.courseName, options.instructorName, options.dateStr].filter(Boolean).forEach(text => paragraph(text!, { center: true }));
    newPage();
  }
  for (const block of layoutDocument(options)) {
    if (block.kind === 'break') { if (y > 72) newPage(); continue; }
    if (block.kind === 'heading') {
      if (/^(references|works cited|bibliography)$/i.test(block.text) && y > 72) newPage();
      paragraph(block.text, { bold: true, italics: (block.level || 1) >= 3, center: block.level === 1, heading: true });
    } else paragraph(block.text, { firstIndent: block.kind === 'paragraph' ? 36 : 0, hanging: block.kind === 'reference' });
  }
  const range = doc.bufferedPageRange();
  for (let page = 0; page < range.count; page++) {
    doc.switchToPage(page);
    doc.font('Times-Roman').fontSize(12).text(String(page + 1), 72, 36, { width: 468, align: 'right', lineBreak: false });
  }
  doc.end();
  return complete;
}
