import { Document, Packer, Paragraph, TextRun, AlignmentType, Header, PageNumber, LineRuleType } from 'docx';
import { parseInlineMarkdown } from './markdown';
import { ExportOptions, layoutDocument } from './documentLayout';
export type DocxExportOptions = ExportOptions;

export async function generateDocxBlob(options: ExportOptions): Promise<Blob> {
  const paragraphs: Paragraph[] = [];
  if (options.includeTitlePage !== false) {
    [options.title, options.authorName, options.institution, options.courseName, options.instructorName, options.dateStr]
      .filter((value): value is string => !!value?.trim()).forEach((text, index) => paragraphs.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: index === 0 ? 1440 : 0, after: index === 0 ? 480 : 0, line: 480, lineRule: LineRuleType.EXACT },
        children: [new TextRun({ text, bold: index === 0 })],
      })));
  }
  const layout = layoutDocument(options);
  layout.forEach((block, index) => {
    if (block.kind === 'break') return;
    const heading = block.kind === 'heading';
    const bibliography = heading && /^(references|works cited|bibliography)$/i.test(block.text);
    paragraphs.push(new Paragraph({
      pageBreakBefore: (index === 0 && options.includeTitlePage !== false) || layout[index - 1]?.kind === 'break' || bibliography,
      alignment: heading && block.level === 1 ? AlignmentType.CENTER : AlignmentType.LEFT,
      keepNext: heading, widowControl: true,
      indent: block.kind === 'paragraph' ? { firstLine: 720 } : block.kind === 'reference' ? { left: 720, hanging: 720 } : undefined,
      spacing: { before: 0, after: 0, line: 480, lineRule: LineRuleType.EXACT },
      children: parseInlineMarkdown(block.text).map(run => new TextRun({ ...run, bold: heading || run.bold, italics: (heading && (block.level || 1) >= 3) || run.italics })),
    }));
  });
  const doc = new Document({
    styles: { default: { document: { run: { font: 'Times New Roman', size: 24, color: '000000' }, paragraph: { spacing: { before: 0, after: 0, line: 480, lineRule: LineRuleType.EXACT } } } } },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440, header: 720 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT] })] })] }) },
      children: paragraphs,
    }],
  });
  return Packer.toBlob(doc);
}
