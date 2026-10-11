const key = 'scholardesk.ai-model';
export function selectedModel(): string {
  try { return localStorage.getItem(key) || 'gemini-3.5-flash-lite'; } catch { return 'gemini-3.5-flash-lite'; }
}
export function selectModel(model: string) {
  try { localStorage.setItem(key, model); } catch { /* Storage may be disabled. */ }
  currentModel = model;
}
let currentModel = selectedModel();
export function aiFetch(url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (url !== '/api/scholarly/search') headers.set('X-AI-Model', currentModel);
  return fetch(url, { ...init, headers });
}

export async function apiErrorMessage(response: Response, fallback: string) {
  try {
    const data = await response.json();
    if (typeof data?.error === 'string' && data.error.trim()) return data.error;
  } catch {
    // Some failures, such as proxy errors, may not return JSON.
  }
  return fallback;
}
