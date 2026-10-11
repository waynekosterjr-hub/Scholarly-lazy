import { ExportOptions, headingText } from './documentLayout';

export interface CitationLineIssue { id: string; line: number; text: string; }
export function citationLineIssues(content: string): CitationLineIssue[] {
  const issues: CitationLineIssue[] = [];
  let inReferences = false;
  content.split(/\r?\n/).forEach((raw, line) => {
    const text = raw.trim();
    if (/^(references|works cited|bibliography)$/i.test(headingText(text))) { inReferences = true; return; }
    if (/^#{1,6}\s/.test(text)) { inReferences = false; return; }
    if (inReferences || !text || text.length > 180) return;
    const year = '(?:[12]\\d{3}[a-z]?|n\\.d\\.)';
    const narrative = new RegExp(`^[\\p{L}\\s.,&’'-]+\\(${year}\\)[.]?$`, 'u');
    const parenthetical = new RegExp(`^\\([^()]*[,;]\\s*${year}[^()]*\\)[.]?$`, 'u');
    const authorWords = text.split('(')[0].trim().split(/[\s,&]+/).filter(Boolean);
    const looksLikeAuthors = authorWords.length > 0 && authorWords.every(word =>
      /^(?:and|et|al\.?|de|del|van|von|der|da|di|la)$/i.test(word) || /^\p{Lu}[\p{L}.’'-]*$/u.test(word),
    );
    if ((narrative.test(text) && looksLikeAuthors) || parenthetical.test(text)) issues.push({ id: `${line}:${text}`, line, text });
  });
  return issues;
}

export function replaceCitationLine(content: string, issue: CitationLineIssue, replacement: string): string {
  const separator = content.includes('\r\n') ? '\r\n' : '\n';
  const lines = content.split(/\r?\n/);
  // Do not act on stale positions after an unrelated editor change.
  if (lines[issue.line]?.trim() !== issue.text) return content;
  if (replacement.trim()) lines[issue.line] = replacement.trim();
  else lines.splice(issue.line, 1);
  return lines.join(separator);
}

export function missingExportDetails(options: ExportOptions): string[] {
  const fields: [string, string | undefined][] = [['Paper title', options.title]];
  if (options.includeTitlePage !== false) fields.push(
    ['Author name', options.authorName], ['Institution', options.institution],
    ['Course', options.courseName], ['Instructor', options.instructorName], ['Due date', options.dateStr],
  );
  return fields.filter(([, value]) => !value?.trim() || /^(untitled (research )?paper|academic paper|general academic draft)$/i.test(value.trim())).map(([name]) => name);
}

export interface StudentDetails { authorName: string; institution: string; courseName: string; instructorName: string; }
export function loadStudentDetails(userId: string): StudentDetails | null {
  try {
    const value = JSON.parse(localStorage.getItem(`scholardesk.student-details:${userId}`) || 'null');
    return value && ['authorName', 'institution', 'courseName', 'instructorName'].every(key => typeof value[key] === 'string') ? {
      authorName: value.authorName, institution: value.institution, courseName: value.courseName, instructorName: value.instructorName,
    } : null;
  } catch { return null; }
}
export function saveStudentDetails(userId: string, details: StudentDetails): void {
  localStorage.setItem(`scholardesk.student-details:${userId}`, JSON.stringify(details));
}
