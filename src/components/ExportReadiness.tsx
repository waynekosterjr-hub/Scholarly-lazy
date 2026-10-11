import React from 'react';
import { ExportOptions } from '../utils/documentLayout';
import { citationLineIssues, missingExportDetails, replaceCitationLine, CitationLineIssue } from '../utils/exportReadiness';

export function ExportReadiness({ options, onChangeContent, onEditDetails }: {
  options: ExportOptions; onChangeContent?: (content: string) => void; onEditDetails: () => void;
}) {
  const [reviewed, setReviewed] = React.useState<string[]>([]);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [replacement, setReplacement] = React.useState('');
  const [undo, setUndo] = React.useState<{ before: string; after: string } | null>(null);
  React.useEffect(() => { setReviewed([]); setEditing(null); }, [options.content]);
  const issues = citationLineIssues(options.content);
  const unresolved = issues.filter(issue => !reviewed.includes(issue.id));
  const missing = missingExportDetails(options);
  const empty = !options.content.trim();
  const apply = (issue: CitationLineIssue, text: string) => {
    const next = replaceCitationLine(options.content, issue, text);
    if (next === options.content) { setEditing(null); return; }
    setUndo({ before: options.content, after: next });
    onChangeContent?.(next);
    setEditing(null);
  };
  return <section aria-label="Export checks" className="rounded-lg border border-gray-300 dark:border-gray-700 p-3 space-y-3 text-xs">
    <h3 className="font-semibold text-sm">Before you export</h3>
    <p role="status">{empty ? 'Add some writing before exporting.' : missing.length || unresolved.length ? `${missing.length} missing detail${missing.length === 1 ? '' : 's'} · ${unresolved.length} citation line${unresolved.length === 1 ? '' : 's'} to review` : 'Basic export checks complete.'}</p>
    {!!missing.length && <div>
      <p>Missing: {missing.join(', ')}.</p>
      <button type="button" onClick={onEditDetails} className="text-blue-600 underline mt-1">Complete document details</button>
      {options.includeTitlePage !== false && <p className="mt-1 text-gray-600 dark:text-gray-300">For assignments without a title page, turn it off in Document details.</p>}
    </div>}
    {unresolved.map(issue => <div key={issue.id} className="border-t border-gray-200 dark:border-gray-700 pt-2 space-y-2">
      <p>Citation by itself on line {issue.line + 1}. Check whether it belongs in a sentence.</p>
      <blockquote className="font-serif bg-gray-100 dark:bg-gray-800 p-2 break-words">{issue.text}</blockquote>
      {editing === issue.id ? <div className="space-y-2">
        <label className="block">Replacement sentence
          <textarea aria-label={`Replacement for line ${issue.line + 1}`} value={replacement} onChange={event => setReplacement(event.target.value)} className="block w-full p-2 border rounded bg-transparent" />
        </label>
        <button type="button" disabled={!replacement.trim()} onClick={() => apply(issue, replacement)} className="text-blue-600 underline disabled:opacity-50">Apply change</button>
        <button type="button" onClick={() => setEditing(null)} className="ml-3 underline">Cancel</button>
      </div> : <div className="flex flex-wrap gap-3">
        {onChangeContent && <>
          <button type="button" onClick={() => { setEditing(issue.id); setReplacement(issue.text); }} className="text-blue-600 underline">Edit line {issue.line + 1}</button>
          <button type="button" onClick={() => apply(issue, '')} className="text-red-600 underline">Remove line {issue.line + 1}</button>
        </>}
        <button type="button" onClick={() => setReviewed(previous => [...previous, issue.id])} className="underline">Keep as written</button>
      </div>}
    </div>)}
    {undo && options.content === undo.after && <button type="button" onClick={() => { onChangeContent?.(undo.before); setUndo(null); }} className="text-blue-600 underline">Undo last text change</button>}
    <p className="text-gray-600 dark:text-gray-300">These checks identify missing details and possible citation fragments. They do not verify sources, grade the paper, or certify compliance with your assignment. You can still export a working draft.</p>
  </section>;
}
