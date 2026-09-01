export async function generateContentWithRetry(ai, params, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      if (error?.status === 503 || error?.message?.includes("503") || error?.message?.includes("UNAVAILABLE")) {
        console.warn(`Gemini API 503 error. Retrying ${i + 1}/${maxRetries} after delay...`);
        await new Promise(res => setTimeout(res, 1500 * (i + 1))); // Exponential-ish backoff
        if (i === maxRetries - 1) throw error;
      } else {
        throw error;
      }
    }
  }
}
