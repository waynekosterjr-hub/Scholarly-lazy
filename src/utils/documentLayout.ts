import { CitationStyle, ScholarlyPaper } from '../types';
import { formatFullReference, sortReferences } from './citationFormatter';

export interface ExportOptions {
  title: string; authorName?: string; institution?: string; courseName?: string;
  instructorName?: string; dateStr?: string; content: string;
  references: ScholarlyPaper[]; citationStyle: CitationStyle; includeTitlePage?: boolean;
}
export type DocumentBlock = { kind: 'paragraph' | 'heading' | 'reference' | 'break' | 'list'; text: string; level?: number };
export const headingText = (text: string) => text.trim().replace(/^#{1,6}\s+/, '').replace(/^\*\*(.*?)\*\*$/, '$1').trim();

// Only collapse adjacent identical headings; never deduplicate prose or citations.
export function parseDocument(content: string): DocumentBlock[] {
  const blocks: DocumentBlock[] = [];
  let inReferences = false;
  for (const raw of content.replace(/\r\n?/g, '\n').split('\n')) {
    if (!raw.trim() && !raw.includes('\f')) continue;
    const line = raw.trim();
    if (raw.includes('\f') || /^(?:---|\*\*\*|===|[-—=*_~#\s]*page\s*break[-—=*_~#\s]*)$/i.test(line)) {
      if (blocks.length && blocks.at(-1)?.kind !== 'break') blocks.push({ kind: 'break', text: '' });
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    const text = headingText(line);
    const isReferences = /^(references|works cited|bibliography)$/i.test(text);
    const previous = blocks.at(-1);
    if (previous?.kind === 'heading' && headingText(previous.text) === text) continue;
    if (heading || isReferences) {
      inReferences = isReferences;
      blocks.push({ kind: 'heading', text, level: isReferences ? 1 : heading![1].length });
    } else {
      blocks.push({ kind: inReferences ? 'reference' : /^([-*+] |\d+[.)] )/.test(line) ? 'list' : 'paragraph', text: line });
    }
  }
  while (blocks.at(-1)?.kind === 'break') blocks.pop();
  return blocks;
}

export function layoutDocument(options: ExportOptions): DocumentBlock[] {
  const blocks = parseDocument(options.content);
  if (blocks.length && headingText(blocks[0].text) === headingText(options.title)) blocks.shift();
  blocks.unshift({ kind: 'heading', text: options.title, level: 1 });
  // Preserve an authored bibliography rather than replacing it with extracted metadata.
  if (!blocks.some(block => block.kind === 'reference') && options.references.length) {
    blocks.push({ kind: 'break', text: '' }, { kind: 'heading', text: options.citationStyle === 'MLA9' ? 'Works Cited' : 'References', level: 1 });
    sortReferences(options.references, options.citationStyle).forEach((paper, index) => {
      blocks.push({ kind: 'reference', text: formatFullReference(paper, options.citationStyle, index) });
    });
  }
  return blocks;
}

export function exportWarnings(options: ExportOptions): string[] {
  const warnings: string[] = [];
  if (options.includeTitlePage && [options.authorName, options.institution, options.courseName, options.instructorName, options.dateStr].some(value => !value?.trim())) {
    warnings.push('The title page is missing student or course details. Complete them below, or turn off the title page if your assignment does not require one.');
  }
  if (parseDocument(options.content).some(block => block.kind === 'paragraph' && /^[\p{L}\s.,&’-]+\(\d{4}[a-z]?\)[.]?$/u.test(block.text))) {
    warnings.push('The draft contains a citation on a line by itself. Check whether it belongs inside a sentence before submitting.');
  }
  return warnings;
}

export function draftWithoutRepeatedHeading(draft: string, heading: string): string {
  const lines = draft.trim().split('\n');
  while (lines.length && (!lines[0].trim() || headingText(lines[0]) === headingText(heading))) lines.shift();
  return lines.join('\n');
}
