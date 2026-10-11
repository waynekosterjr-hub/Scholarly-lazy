import React from 'react';
import { selectedModel, selectModel } from '../lib/aiApi';
export function ModelSelector() {
  const [model, setModel] = React.useState(selectedModel);
  const [models, setModels] = React.useState<{ id: string; name: string }[]>([]);
  const [error, setError] = React.useState('');
  React.useEffect(() => {
    let active = true;
    fetch('/api/models').then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Models unavailable');
      if (!active) return;
      setModels(data.models);
      if (!['auto', 'quality'].includes(model) && !data.models.some((item: { id: string }) => item.id === model) && data.models.length) {
        const fallback = data.models.find((item: { id: string }) => item.id === 'gemini-3.5-flash-lite') || data.models[0];
        setModel(fallback.id); selectModel(fallback.id);
      }
    }).catch(() => { if (active) setError('Could not load models. Reload to retry.'); });
    return () => { active = false; };
  }, []);
  return <span>
    <select aria-label="AI model" disabled={!models.length} value={model} title={error || 'Used for subsequent AI requests; availability and usage costs depend on your account.'}
      onChange={event => { setModel(event.target.value); selectModel(event.target.value); }}
      className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded border border-gray-300 px-1 py-0.5 max-w-48">
      {!models.length && <option value={model}>{error ? 'Models unavailable' : 'Loading models…'}</option>}
      {!!models.length && <option value="auto">Automatic — task-based</option>}
      {!!models.length && <option value="quality">Prefer reasoning models</option>}
      {models.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
    </select>
    {['auto', 'quality'].includes(model) && <span className="ml-1 text-xs text-gray-500">Uses available cloud models; reasoning tasks may cost more. Quota still applies.</span>}
    {error && <span role="status" className="ml-1 text-amber-600">{error}</span>}
  </span>;
}
