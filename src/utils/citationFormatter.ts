import { ScholarlyPaper, CitationStyle } from '../types';

/**
 * Formats in-text citations according to academic standards.
 * APA 7: (Author, Year) or (Author & Author, Year) or (Author et al., Year)
 * MLA 9: (Author Page) or (Author)
 * Chicago: (Author Year) or footnote style
 * IEEE: [1]
 */
export function formatInTextCitation(
  paper: ScholarlyPaper,
  style: CitationStyle = 'APA7',
  options: { narrative?: boolean; page?: string; citationIndex?: number } = {}
): string {
  const authors = paper.authors || [];
  const year = paper.year ? paper.year.toString() : 'n.d.';
  const narrative = options.narrative || false;

  const getLastName = (fullName: string) => {
    if (!fullName) return 'Anonymous';
    const parts = fullName.trim().split(/\s+/);
    return parts[parts.length - 1];
  };

  if (style === 'IEEE') {
    const idx = options.citationIndex !== undefined ? options.citationIndex + 1 : 1;
    return `[${idx}]`;
  }

  if (authors.length === 0) {
    const shortTitle = paper.title.length > 25 ? `"${paper.title.slice(0, 25)}..."` : `"${paper.title}"`;
    return narrative ? `${shortTitle} (${year})` : `(${shortTitle}, ${year})`;
  }

  if (authors.length === 1) {
    const lastName = getLastName(authors[0].name);
    if (style === 'MLA9') {
      const pageStr = options.page ? ` ${options.page}` : '';
      return narrative ? `${lastName}${pageStr ? ` (p. ${options.page})` : ''}` : `(${lastName}${pageStr})`;
    }
    if (narrative) {
      return `${lastName} (${year})`;
    }
    return `(${lastName}, ${year})`;
  }

  if (authors.length === 2) {
    const author1 = getLastName(authors[0].name);
    const author2 = getLastName(authors[1].name);
    if (style === 'MLA9') {
      const pageStr = options.page ? ` ${options.page}` : '';
      return narrative ? `${author1} and ${author2}${pageStr ? ` (p. ${options.page})` : ''}` : `(${author1} and ${author2}${pageStr})`;
    }
    if (narrative) {
      return `${author1} and ${author2} (${year})`;
    }
    return `(${author1} & ${author2}, ${year})`;
  }

  // 3 or more authors
  const firstAuthor = getLastName(authors[0].name);
  if (style === 'MLA9') {
    const pageStr = options.page ? ` ${options.page}` : '';
    return narrative ? `${firstAuthor} et al.${pageStr ? ` (p. ${options.page})` : ''}` : `(${firstAuthor} et al.${pageStr})`;
  }
  if (narrative) {
    return `${firstAuthor} et al. (${year})`;
  }
  return `(${firstAuthor} et al., ${year})`;
}

/**
 * Formats full bibliographic reference entry.
 */
export function formatFullReference(
  paper: ScholarlyPaper,
  style: CitationStyle = 'APA7',
  index: number = 0
): string {
  const authors = paper.authors || [];
  const year = paper.year ? paper.year.toString() : 'n.d.';
  const title = paper.title.trim().replace(/\.$/, '');
  const venue = paper.venue ? paper.venue.trim() : 'Scholarly Journal';
  const url = paper.url || (paper.doi ? `https://doi.org/${paper.doi}` : '');

  // APA Author formatting: Last, F. M., & Last, F. M.
  const formatAPAAuthors = () => {
    if (authors.length === 0) return 'Anonymous';
    const formatted = authors.map(a => {
      const parts = a.name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0];
      const last = parts.pop();
      const initials = parts.map(p => p[0].toUpperCase() + '.').join(' ');
      return `${last}, ${initials}`;
    });

    if (formatted.length === 1) return formatted[0];
    if (formatted.length === 2) return `${formatted[0]}, & ${formatted[1]}`;
    if (formatted.length <= 20) {
      return `${formatted.slice(0, -1).join(', ')}, & ${formatted[formatted.length - 1]}`;
    }
    return `${formatted.slice(0, 19).join(', ')}, ... ${formatted[formatted.length - 1]}`;
  };

  // MLA Author formatting: Last, First, and First Last.
  const formatMLAAuthors = () => {
    if (authors.length === 0) return 'Anonymous';
    if (authors.length === 1) {
      const parts = authors[0].name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0];
      const last = parts.pop();
      return `${last}, ${parts.join(' ')}`;
    }
    if (authors.length === 2) {
      const p1 = authors[0].name.trim().split(/\s+/);
      const last1 = p1.pop();
      return `${last1}, ${p1.join(' ')}, and ${authors[1].name}`;
    }
    const p1 = authors[0].name.trim().split(/\s+/);
    const last1 = p1.pop();
    return `${last1}, ${p1.join(' ')}, et al.`;
  };

  switch (style) {
    case 'APA7': {
      // APA 7: Author, A. A. (Year). Title of paper in sentence case. Journal Name in Italics. URL
      const authorStr = formatAPAAuthors();
      const venueStr = venue ? ` ${venue}.` : '';
      const urlStr = url ? ` ${url}` : '';
      return `${authorStr} (${year}). ${title}.${venueStr}${urlStr}`;
    }

    case 'MLA9': {
      // MLA 9: Author. "Title of Article." Journal Name, vol., no., Year, pp. URL.
      const authorStr = formatMLAAuthors();
      const venueStr = venue ? ` ${venue},` : '';
      const urlStr = url ? ` ${url}.` : '';
      return `${authorStr}. "${title}."${venueStr} ${year}.${urlStr}`;
    }

    case 'CHICAGO': {
      // Chicago Author-Date: Author. Year. "Title of Article." Journal Name. URL.
      const authorStr = formatMLAAuthors();
      const venueStr = venue ? ` ${venue}.` : '';
      const urlStr = url ? ` ${url}.` : '';
      return `${authorStr}. ${year}. "${title}."${venueStr}${urlStr}`;
    }

    case 'IEEE': {
      // IEEE: [1] F. M. Last, "Title of paper," Journal Name, Year.
      const formattedAuthors = authors.map(a => {
        const parts = a.name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0];
        const last = parts.pop();
        const initials = parts.map(p => p[0].toUpperCase() + '.').join(' ');
        return `${initials} ${last}`;
      }).join(', ');
      const authStr = formattedAuthors || 'Anonymous';
      const venueStr = venue ? `, ${venue}` : '';
      return `[${index + 1}] ${authStr}, "${title}"${venueStr}, ${year}.`;
    }

    case 'HARVARD': {
      const authorStr = formatAPAAuthors().replace('&', 'and');
      const venueStr = venue ? `, ${venue}` : '';
      const urlStr = url ? `, Available at: ${url}` : '';
      return `${authorStr} (${year}) '${title}'${venueStr}${urlStr}.`;
    }

    default:
      return `${formatAPAAuthors()} (${year}). ${title}. ${venue}.`;
  }
}
