import React from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
GlobalWorkerOptions.workerSrc = workerUrl;

export default function PdfPreview({ url }: { url: string }) {
  const container = React.useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState('');
  React.useEffect(() => {
    let cancelled = false;
    const task = getDocument({ url });
    setError('');
    container.current?.replaceChildren();
    (async () => {
      const pdf = await task.promise;
      for (let number = 1; number <= pdf.numPages && !cancelled; number++) {
        const page = await pdf.getPage(number);
        if (cancelled) break;
        const viewport = page.getViewport({ scale: 1.4 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width; canvas.height = viewport.height;
        canvas.setAttribute('aria-label', `Export page ${number} of ${pdf.numPages}`);
        canvas.className = 'w-full h-auto bg-white shadow mb-3';
        await page.render({ canvas, viewport }).promise;
        if (!cancelled) container.current?.append(canvas);
      }
    })().catch(error => { if (!cancelled) { console.error('PDF preview failed', error); setError('Preview could not load. Download the PDF to inspect it.'); } });
    return () => { cancelled = true; void task.destroy(); };
  }, [url]);
  return <div aria-label="Exported PDF preview" className="max-h-96 overflow-auto bg-gray-200 p-2">
    {error && <p role="alert">{error}</p>}
    <div ref={container} />
  </div>;
}
