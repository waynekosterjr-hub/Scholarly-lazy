import { generatePdf } from './src/utils/pdfExport';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { academicPolicy, academicContext, chooseTaskModel } from './src/lib/academicPolicy';
import type { DraftSectionResponse, EditorAssistResponse, DocumentTextResponse } from './src/types';

dotenv.config({ path: ['.env.local', '.env'] });

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize Gemini Client lazily to prevent startup crashes if API key is missing
let aiClient: any = null;

function getAiClient() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function generateContentWithRetry(params: any, maxRetries = 3) {
  params = { ...params, config: { ...params.config, systemInstruction: `${academicPolicy}\n${params.config?.systemInstruction || ''}` } };
  const ai = getAiClient();
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      const is503 = error?.status === 503 || 
                    (error?.message && error.message.includes("503")) ||
                    (error?.message && error.message.includes("UNAVAILABLE"));
      if (is503) {
        console.warn(`Gemini API 503 error. Retrying ${i + 1}/${maxRetries} after delay...`);
        await new Promise(res => setTimeout(res, 2000 * (i + 1))); // backoff
        if (i === maxRetries - 1) throw error;
      } else {
        throw error;
      }
    }
  }
}

// API Routes
let modelCache: { id: string; name: string }[] = [];
let modelCacheTime = 0;
async function availableModels() {
  if (modelCache.length && Date.now() - modelCacheTime < 300000) return modelCache;
  const pager = await getAiClient().models.list({ config: { pageSize: 100 } });
  const models: { id: string; name: string }[] = [];
  for await (const model of pager) {
    const id = model.name?.replace(/^models\//, '');
    if (id?.startsWith('gemini-') && model.supportedActions?.includes('generateContent') && !/image|tts|robotics|computer-use|transcribe|customtools/i.test(id)) {
      models.push({ id, name: model.displayName || id });
    }
  }
  modelCache = models; modelCacheTime = Date.now();
  return models;
}
app.get('/api/models', async (_req, res) => {
  try { res.json({ models: await availableModels() }); }
  catch { res.status(503).json({ error: 'Unable to list models for the configured AI account.' }); }
});
app.use('/api', async (req, res, next) => {
  let model = req.get('X-AI-Model');
  if (!model) return next();
  try {
    if (model === 'auto' || model === 'quality') {
      model = chooseTaskModel(await availableModels(), model, req.path);
      req.headers['x-ai-model'] = model;
      res.set('X-AI-Model', model);
    }
    if (!(await availableModels()).some(item => item.id === model)) return res.status(400).json({ error: `The selected model ${model} is not available for this API key. Choose Gemini 3.5 Flash-Lite or another listed Flash model, then retry.` });
    next();
  } catch { res.status(503).json({ error: 'Unable to validate the selected AI model. Please retry.' }); }
});

function describeAiError(error: any, requestedModel?: string) {
  const rawMessage = String(error?.message || '');
  const status = Number(error?.status) || 500;
  const modelMatch = rawMessage.match(/model[:=]\s*([a-z0-9._-]+)/i);
  const model = requestedModel || modelMatch?.[1] || 'the selected model';
  const retryMatch = rawMessage.match(/retry(?:Delay| in)[^0-9]*(\d+)/i);
  const retryText = retryMatch ? ` Try again in about ${retryMatch[1]} seconds, or choose a Flash model.` : ' Choose a Flash or Flash-Lite model and retry.';

  if (/GEMINI_API_KEY/.test(rawMessage)) {
    return { status: 503, message: 'AI is not configured. Add GEMINI_API_KEY to .env.local and restart the app.' };
  }

  if (status === 429 || /RESOURCE_EXHAUSTED|quota exceeded|rate-limit|rate limit/i.test(rawMessage)) {
    return {
      status: 429,
      message: `Gemini rejected ${model} because the configured API key is out of quota for that model.${retryText}`,
    };
  }

  if (status === 503 || /UNAVAILABLE|high demand|overloaded/i.test(rawMessage)) {
    return {
      status: 503,
      message: `Gemini says ${model} is under high demand right now. Choose a Flash or Flash-Lite model and retry.`,
    };
  }

  if (status === 400 || /API key|invalid|permission|not found/i.test(rawMessage)) {
    return {
      status: 400,
      message: `Gemini could not run ${model}. Check that the API key has access to this model, or choose a different model.`,
    };
  }

  return { status: 500, message: 'The AI request failed. Try another model or retry in a moment.' };
}

function sendAiError(res: any, error: any, requestedModel?: string) {
  const described = describeAiError(error, requestedModel);
  return res.status(described.status).json({ error: described.message });
}

app.post('/api/export/pdf', async (req, res) => {
  const options = req.body;
  if (typeof options?.title !== 'string' || typeof options?.content !== 'string' || !Array.isArray(options.references) || options.content.length > 500000) {
    return res.status(400).json({ error: 'A title, document content, and reference list are required.' });
  }
  try {
    const pdf = await generatePdf(options);
    res.type('application/pdf').send(pdf);
  } catch (error) {
    console.error('PDF export failed', error);
    res.status(500).json({ error: 'Unable to generate PDF. Check the document and retry.' });
  }
});


// 1. Semantic Scholar API Proxy & Literature Discovery
let scholarCooldownUntil = 0;
app.post('/api/scholarly/search', async (req, res) => {
  try {
    const { query, limit = 10, year } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const safeLimit = Math.min(50, Math.max(1, Math.floor(Number(limit) || 10)));
    if (year && !/^\d{4}(-\d{4})?$/.test(String(year))) return res.status(400).json({ error: 'Year must be YYYY or YYYY-YYYY.' });
    const fields = 'paperId,title,authors,year,abstract,url,citationCount,venue,externalIds';
    let s2Url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(
      query
    )}&limit=${safeLimit}&fields=${fields}`;

    if (year) {
      s2Url += `&year=${encodeURIComponent(year)}`;
    }

    try {
      if (Date.now() < scholarCooldownUntil) throw new Error('Semantic Scholar rate-limit cooldown');
      const response = await fetch(s2Url, {
        headers: {
          'User-Agent': 'AcademicResearchStudio/1.0',
          ...(process.env.SEMANTIC_SCHOLAR_API_KEY ? { 'x-api-key': process.env.SEMANTIC_SCHOLAR_API_KEY } : {}),
        },
        signal: AbortSignal.timeout(6500),
      });
      if (response.status === 429) scholarCooldownUntil = Date.now() + Math.max(60000, (Number(response.headers.get('retry-after')) || 0) * 1000);

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.data) && data.data.length > 0) {
          const papers = data.data.map((p: any) => ({
            paperId: p.paperId || `s2-${Math.random().toString(36).substring(2, 9)}`,
            title: p.title || 'Untitled Scholarly Publication',
            authors: (p.authors || []).map((a: any) => ({ name: a.name || 'Anonymous', authorId: a.authorId })),
            year: p.year || null,
            abstract: p.abstract || null,
            source: 'Semantic Scholar',
            url: p.url || (p.externalIds?.DOI ? `https://doi.org/${p.externalIds.DOI}` : undefined),
            citationCount: p.citationCount || 0,
            venue: p.venue || '',
            doi: p.externalIds?.DOI || '',
          }));
          return res.json({ papers, source: 'semantic_scholar_live' });
        }
        if (Array.isArray(data?.data)) return res.json({ papers: [], source: 'semantic_scholar_live' });
      }
    } catch (fetchErr) {
      console.warn('Semantic Scholar live fetch failed or timed out, no unverified references will be substituted:', fetchErr);
    }

    // Crossref provides publisher-deposited records, never AI-generated references.
    try {
      const params = new URLSearchParams({ query: query.trim(), rows: String(safeLimit) });
      const filters = ['type:journal-article'];
      if (year) {
        const [from, to = from] = String(year).split('-');
        filters.push(`from-pub-date:${from}`, `until-pub-date:${to}`);
      }
      params.set('filter', filters.join(','));
      const response = await fetch(`https://api.crossref.org/works?${params}`, {
        headers: { 'User-Agent': 'ScholarDesk/1.0' }, signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error(`Crossref status ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data.message?.items)) throw new Error('Invalid Crossref response');
      const plain = (text: string) => String(text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const papers = data.message.items.filter((p: any) => p.DOI && p.title?.[0]).map((p: any) => ({
        paperId: `crossref:${p.DOI.toLowerCase()}`, title: plain(p.title[0]),
        authors: (p.author || []).map((a: any) => ({ name: [a.given, a.family].filter(Boolean).join(' ') || a.name || 'Unknown author' })),
        year: p.published?.['date-parts']?.[0]?.[0] || null,
        abstract: p.abstract ? plain(p.abstract) : null,
        url: `https://doi.org/${p.DOI}`, doi: p.DOI, venue: plain(p['container-title']?.[0]),
        citationCount: p['is-referenced-by-count'] || 0, source: 'Crossref',
      }));
      return res.json({ papers, source: 'crossref_live' });
    } catch (error) { console.warn('Crossref fallback unavailable:', error); }
    return res.status(503).json({ error: 'Semantic Scholar and Crossref are temporarily unavailable. Please try again shortly.' });
  } catch (error: any) {
    console.error('Error in /api/scholarly/search:', error);
    res.status(500).json({ error: error.message || 'Failed to search scholarly articles' });
  }
});

// 1b. Context-Aware Literature Query Suggestions (Based on Center Document & Left Rubric)
app.post('/api/scholarly/suggest-topics', async (req, res) => {
  try {
    const { documentText, rubric, studentDirection } = req.body;

    const rubricContext = rubric
      ? `Assignment: "${rubric.title || ''}" (${rubric.assignmentType || ''})\nTopic Constraints: ${(rubric.topicConstraints || []).join('; ')}\nKey Questions: ${(rubric.keyQuestionsToAnswer || []).join('; ')}\nCriteria: ${(rubric.criteria || []).map((c: any) => c.category).join(', ')}`
      : 'General Academic Inquiry';

    const docExcerpt = (documentText || '').slice(0, 3000);

    const prompt = `You are a research librarian and literature assistant.
Given the student's paper text (Center Panel) and Assignment Rubric & Rules (Left Panel), generate 5-6 highly specific, high-yield academic search queries that would discover top peer-reviewed empirical studies, seminal literature, and counter-arguments in Semantic Scholar.

Rubric & Constraints:
${rubricContext}

Student's Direction / Thesis:
"${studentDirection || 'Develop empirical analysis'}"

Current Paper Draft Snippet:
"""
${docExcerpt || 'No draft written yet. Generate foundational literature queries based on the rubric.'}
"""

Instructions:
- Return 5-6 short, targeted academic keyword search queries (3 to 6 words each, e.g. "prefrontal cortex screen time fMRI", "working memory media multitasking meta-analysis").
- Ensure queries directly reflect key themes in the center draft and rubric criteria.`;

    const response = await generateContentWithRetry({
      model: req.get('X-AI-Model') || 'gemini-3.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              query: { type: Type.STRING },
              label: { type: Type.STRING, description: 'Short badge label (e.g. "Working Memory", "Neuroimaging")' },
              rationale: { type: Type.STRING, description: 'Why this query is relevant' },
            },
            required: ['query', 'label'],
          },
        },
      },
    });

    const suggestions = JSON.parse(response.text || '[]');
    return res.json({ suggestions });
  } catch (error: any) {
    console.error('Error in /api/scholarly/suggest-topics:', error);
    return res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

app.post('/api/rubric/extract', async (req, res) => {
  try {
    const { rawText, imageBase64, imageMimeType, pdfBase64 } = req.body;

    let contents: any[] = [];
    const systemPrompt = `You are an expert academic evaluator, syllabus parser, and grading rubric analyzer.
Extract the exact assignment details, grading rubric breakdown, word count bounds, topic constraints, citation requirements, and evaluation criteria from the provided assignment text or image.

Ensure that:
1. Preserve stated criterion weights, converting points proportionally to percentages only when the complete points total is known. Use weight 0 for unspecified weights; do not invent grading criteria.
2. Extract word count bounds exactly. Use 0 for unspecified bounds or targets, and requiredSourceCount 0 if unspecified. Never substitute standard assignment lengths.
3. Citation style (APA7, MLA9, CHICAGO, IEEE, HARVARD) is detected.
4. Key questions and topic constraints are clearly broken down.`;

    if (imageBase64) {
      const mime = imageMimeType || 'image/png';
      contents = [
        {
          inlineData: {
            mimeType: mime,
            data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
          },
        },
        {
          text: `Extract all rubric details and assignment instructions from this syllabus/rubric screenshot. If any text is handwritten or low-contrast, perform OCR with high precision.\n\n${rawText || ''}`,
        },
      ];
    } else if (pdfBase64) {
      contents = [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: pdfBase64.replace(/^data:application\/pdf;base64,/, ''),
          },
        },
        {
          text: `Extract all rubric details and assignment instructions from this syllabus/rubric PDF.\n\n${rawText || ''}`,
        },
      ];
    } else {
      contents = [
        {
          text: `Here is the assignment text / syllabus:\n\n${rawText || 'Standard Research Paper Assignment'}`,
        },
      ];
    }

    const response = await generateContentWithRetry({
      model: req.get('X-AI-Model') || 'gemini-3.5-flash-lite',
      contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Assignment title or topic' },
            courseName: { type: Type.STRING, description: 'Course or module name if mentioned' },
            assignmentType: { type: Type.STRING, description: 'E.g. Argumentative Essay, Literature Review, Empirical Research Paper, Policy Brief' },
            requiredWordCount: {
              type: Type.OBJECT,
              properties: {
                min: { type: Type.INTEGER },
                max: { type: Type.INTEGER },
                target: { type: Type.INTEGER },
              },
              required: ['min', 'max', 'target'],
            },
            requiredCitationStyle: {
              type: Type.STRING,
              description: 'One of APA7, MLA9, CHICAGO, IEEE, HARVARD',
            },
            requiredSourceCount: { type: Type.INTEGER, description: 'Minimum number of peer-reviewed sources required' },
            deadline: { type: Type.STRING },
            topicConstraints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Specific topic boundaries, forbidden areas, or scope constraints',
            },
            keyQuestionsToAnswer: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Key research or argumentative questions required to be addressed',
            },
            formattingRules: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Formatting specifications like double-spacing, 1-inch margins, title page rules',
            },
            criteria: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  category: { type: Type.STRING, description: 'E.g. Thesis & Argumentation, Literature & Evidence, Academic Tone, Structure & Synthesis' },
                  description: { type: Type.STRING },
                  weight: { type: Type.INTEGER, description: 'Weight percentage (0-100)' },
                  guidelines: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['id', 'category', 'description', 'weight', 'guidelines'],
              },
            },
          },
          required: [
            'title',
            'assignmentType',
            'requiredWordCount',
            'requiredCitationStyle',
            'requiredSourceCount',
            'topicConstraints',
            'keyQuestionsToAnswer',
            'criteria',
          ],
        },
      },
    });

    const parsedRubric = JSON.parse(response.text || '{}');
    // Ensure valid citation style fallback
    if (!['APA7', 'MLA9', 'CHICAGO', 'IEEE', 'HARVARD'].includes(parsedRubric.requiredCitationStyle)) {
      parsedRubric.requiredCitationStyle = 'APA7';
    }
    // Ensure criteria have status default
    if (Array.isArray(parsedRubric.criteria)) {
      parsedRubric.criteria = parsedRubric.criteria.map((c: any, index: number) => ({
        ...c,
        id: c.id || `crit-${index + 1}`,
        status: 'unmet',
      }));
    }

    return res.json({ rubric: parsedRubric });
  } catch (error: any) {
    console.error('Error in /api/rubric/extract:', error);
    res.status(500).json({ error: error.message || 'Failed to extract rubric details' });
  }
});

// 3. Strategy & Cross-Referencing Engine (Outline Generation)
app.post('/api/strategy/outline', async (req, res) => {
  try {
    const { rubric: suppliedRubric, studentDirection, selectedArticles, citationStyle } = req.body;
    const rubric = { ...suppliedRubric, requiredCitationStyle: citationStyle || suppliedRubric?.requiredCitationStyle };

    const articlesSummary = (selectedArticles || [])
      .map(
        (a: any, idx: number) =>
          `[Article ${idx + 1}] ID: ${a.paperId} | Title: "${a.title}" | Authors: ${(a.authors || [])
            .map((auth: any) => auth.name)
            .join(', ')} (${a.year || 'n.d.'})\nAbstract: ${a.abstract || 'N/A'}`
      )
      .join('\n\n');

    const prompt = `You are a distinguished university academic writing advisor.
Rubric Context:
- Title: ${rubric?.title || 'Academic Paper'}
- Type: ${rubric?.assignmentType || 'Research Essay'}
- Target Word Count: ${rubric?.requiredWordCount?.target || 2000} words (Range: ${rubric?.requiredWordCount?.min || 1500} - ${rubric?.requiredWordCount?.max || 2500})
- Citation Style: ${rubric?.requiredCitationStyle || 'APA 7th Edition'}
- Topic Constraints: ${(rubric?.topicConstraints || []).join('; ')}
- Grading Criteria: ${(rubric?.criteria || []).map((c: any) => `${c.category} (${c.weight}%): ${c.description}`).join('; ')}

Student's Thesis / Research Direction:
"${studentDirection || 'Develop a rigorous empirical inquiry addressing the assignment prompts.'}"

Selected Scholarly Articles Pool:
${articlesSummary || 'No external articles pre-selected.'}

Task:
Create a rigorous, highly detailed academic paper outline with 4 to 6 main sections (e.g. Introduction & Thesis, Literature Review & Theoretical Framework, Core Arguments / Empirical Analysis, Counterarguments & Nuanced Synthesis, Discussion & Implications, Conclusion).
For each section and subpoint:
1. Provide a clear academic title and description of the argument.
2. Explicitly specify which of the Selected Articles (using their paperId) MUST be cross-referenced to support claims or serve as counter-arguments.
3. Assign target word counts per section that sum up to approximately ${rubric?.requiredWordCount?.target || 2000} words (a planning suggestion if no count is supplied).
4. Adapt section count and structure to the assignment type and length, including short discussion responses. In each point description identify the relevant rubric criterion ID and explain how the point meets it. Cover every criterion and required question. Where evidence is missing, state what the student needs to find; use only supplied paper IDs and leave citedPaperIds empty if none support the point.
${academicContext(suppliedRubric, selectedArticles)}`;

    const response = await generateContentWithRetry({
      model: req.get('X-AI-Model') || 'gemini-3.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              heading: { type: Type.STRING },
              description: { type: Type.STRING },
              targetWordCount: { type: Type.INTEGER },
              points: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    citedPaperIds: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    isCounterArgument: { type: Type.BOOLEAN },
                    estimatedWords: { type: Type.INTEGER },
                  },
                  required: ['id', 'title', 'description', 'citedPaperIds'],
                },
              },
            },
            required: ['id', 'heading', 'description', 'targetWordCount', 'points'],
          },
        },
      },
    });

    const outline = JSON.parse(response.text || '[]');
    return res.json({ outline });
  } catch (error: any) {
    console.error('Error in /api/strategy/outline:', error);
    sendAiError(res, error, req.get('X-AI-Model'));
  }
});

// 4. Section-by-Section Draft Assistance
app.post('/api/strategy/draft-section', async (req, res) => {
  try {
    const { section, rubric: suppliedRubric, studentDirection, selectedArticles, existingDocumentText, citationStyle } = req.body;
    const rubric = { ...suppliedRubric, requiredCitationStyle: citationStyle || suppliedRubric?.requiredCitationStyle };
    if (!section?.heading) return res.status(400).json({ error: "An outline section is required." });

    const articlesSummary = (selectedArticles || [])
      .map(
        (a: any) =>
          `ID: ${a.paperId} | Title: "${a.title}" | Authors: ${(a.authors || []).map((au: any) => au.name).join(', ')} (${a.year || 'n.d.'})\nAbstract: ${a.abstract}`
      )
      .join('\n\n');

    const prompt = `You are an academic scholar and writing mentor assisting a student in drafting a specific section of their academic paper.
Assignment: ${rubric?.title || 'Academic Paper'} (${rubric?.requiredCitationStyle || 'APA7'} style)
Student Direction / Thesis: ${studentDirection || 'Academic inquiry'}

Section to Draft:
- Heading: ${section.heading}
- Description: ${section.description}
- Target Word Count: ~${section.targetWordCount || 400} words
- Key Points: ${(section.points || []).map((p: any) => `${p.title}: ${p.description}`).join('\n')}

Selected Scholarly Articles for In-Text Citation:
${articlesSummary}

Context from existing document (if any):
${(existingDocumentText || '').slice(-1200)}

Instructions:
1. Write polished, rigorous academic prose for this section.
2. Embed proper in-text citations according to ${rubric?.requiredCitationStyle || 'APA 7th edition'} format (e.g. (Author, Year) or Author (Year)). Only cite articles from the provided selected articles pool.
3. Maintain objective scholarly tone, strong topic sentences, and evidence-based analysis.
4. Return ONLY the drafted prose for this section (with standard paragraph breaks, no markdown meta commentaries). Include explicit [Evidence needed: ...] markers wherever support is missing.
5. Address the relevant grading criteria and required questions. Use a claim, supplied evidence, analysis, and connection to the thesis. Avoid padding, invented findings, and repeating the existing draft.
${academicContext(suppliedRubric, selectedArticles)}`;

    const response = await generateContentWithRetry({
      model: req.get('X-AI-Model') || 'gemini-3.5-flash-lite',
      contents: prompt,
    });

    return res.json({ draftContent: response.text || '' } satisfies DraftSectionResponse);
  } catch (error: any) {
    console.error('Error in /api/strategy/draft-section:', error);
    sendAiError(res, error, req.get('X-AI-Model'));
  }
});

// 5. Strict Academic Professor Proofreading & Rubric Grading
app.post('/api/proofread/review', async (req, res) => {
  const requestedModel = req.get('X-AI-Model') || 'gemini-3.5-flash-lite';
  try {
    const { documentText, rubric: suppliedRubric, selectedArticles, citationStyle } = req.body;
    const rubric = { ...suppliedRubric, requiredCitationStyle: citationStyle || suppliedRubric?.requiredCitationStyle };

    if (!documentText || documentText.trim().length < 50) {
      return res.status(400).json({ error: 'Document text is too short for comprehensive academic review' });
    }

    const prompt = `Act as a strict, discerning academic professor and journal peer-reviewer.
Evaluate this student's paper against the exact grading rubric, word count constraints, and APA/scholarly citation standards.

Rubric Information:
- Assignment Title: ${rubric?.title || 'Academic Paper'}
- Required Word Count: minimum ${rubric?.requiredWordCount?.min || 'not specified'}, maximum ${rubric?.requiredWordCount?.max || 'not specified'}, target ${rubric?.requiredWordCount?.target || 'not specified'}
- Citation Style: ${rubric?.requiredCitationStyle || 'APA7'}
- Required Source Count: ${rubric?.requiredSourceCount || 'not specified'}
- Criteria Breakdown:
${(rubric?.criteria || []).map((c: any) => `- [${c.id}] ${c.category} (${c.weight}%): ${c.description}. Guidelines: ${(c.guidelines || []).join(', ')}`).join('\n')}

Selected References Pool in the Student's Library:
${(selectedArticles || []).map((a: any) => `- "${a.title}" by ${(a.authors || []).map((au: any) => au.name).join(', ')} (${a.year})`).join('\n')}

Student's Submitted Document:
"""
${documentText}
"""

Task:
Perform a comprehensive academic review:
1. Grade each rubric criterion objectively, giving score obtained out of the max weight percentage, with specific feedback and status ('fulfilled', 'partially_met', 'unmet').
2. Calculate overall numerical score (0 to 100) and letter grade (A+, A, A-, B+, B, B-, C+, C, D, F).
3. Identify top strengths and critical weaknesses.
4. Extract in-text citations and assess style. paperFound means a match in the supplied library only, never independent verification. In notes distinguish library matches from claim support; explicitly say full text was not verified. Do not assert a source is real from memory.
5. Provide actionable, high-priority suggestions with exact locations and concrete revisions.
6. Analyze word count against supplied bounds only. Do not penalize unspecified requirements. Label the grade provisional. Quote evidence from the draft for each criterion, and identify the precise change needed to improve it. Prioritize missing rubric requirements, unsupported claims, and evidence gaps before style. Do not equate fluent prose with strong scholarship.
${academicContext(suppliedRubric, selectedArticles)}`;

    const response = await generateContentWithRetry({
      model: requestedModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.INTEGER, description: 'Overall grade out of 100' },
            letterGrade: { type: Type.STRING },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            weaknesses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            rubricAdherence: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  criterionId: { type: Type.STRING },
                  criterionTitle: { type: Type.STRING },
                  scoreObtained: { type: Type.NUMBER },
                  maxScore: { type: Type.NUMBER },
                  feedback: { type: Type.STRING },
                  status: { type: Type.STRING, description: 'fulfilled, partially_met, or unmet' },
                },
                required: ['criterionId', 'criterionTitle', 'scoreObtained', 'maxScore', 'feedback', 'status'],
              },
            },
            citationChecks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  citationText: { type: Type.STRING },
                  paperFound: { type: Type.BOOLEAN },
                  paperTitle: { type: Type.STRING },
                  styleCompliant: { type: Type.BOOLEAN },
                  notes: { type: Type.STRING },
                },
                required: ['citationText', 'paperFound', 'styleCompliant', 'notes'],
              },
            },
            actionableSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  section: { type: Type.STRING },
                  issue: { type: Type.STRING },
                  suggestion: { type: Type.STRING },
                  priority: { type: Type.STRING, description: 'high, medium, or low' },
                },
                required: ['section', 'issue', 'suggestion', 'priority'],
              },
            },
            wordCountAnalysis: {
              type: Type.OBJECT,
              properties: {
                currentWords: { type: Type.INTEGER },
                targetWords: { type: Type.INTEGER },
                status: { type: Type.STRING, description: 'within_range, too_short, or too_long' },
                recommendation: { type: Type.STRING },
              },
              required: ['currentWords', 'targetWords', 'status', 'recommendation'],
            },
          },
          required: ['overallScore', 'letterGrade', 'strengths', 'weaknesses', 'rubricAdherence', 'citationChecks', 'actionableSuggestions', 'wordCountAnalysis'],
        },
      },
    });

    const feedback = JSON.parse(response.text || '{}');
    const criteria = suppliedRubric?.criteria || [];
    feedback.rubricAdherence = criteria.map((criterion: any) => {
      const row = (feedback.rubricAdherence || []).find((item: any) => item.criterionId === criterion.id);
      const maxScore = Math.max(0, Number(criterion.weight) || 0);
      return { ...row, criterionId: criterion.id, criterionTitle: criterion.category, maxScore,
        scoreObtained: Math.min(maxScore, Math.max(0, Number(row?.scoreObtained) || 0)),
        status: row?.status || 'unmet', feedback: row?.feedback || 'This criterion was not evaluated. Review it against the draft.' };
    });
    const totalWeight = criteria.reduce((sum: number, c: any) => sum + (Number(c.weight) || 0), 0);
    const scored = criteria.length > 0 && criteria.every((c: any) => Number(c.weight) > 0);
    feedback.overallScore = scored ? Math.round(100 * feedback.rubricAdherence.reduce((sum: number, c: any) => sum + c.scoreObtained, 0) / totalWeight) : 0;
    feedback.letterGrade = scored ? (feedback.overallScore >= 90 ? 'A' : feedback.overallScore >= 80 ? 'B' : feedback.overallScore >= 70 ? 'C' : feedback.overallScore >= 60 ? 'D' : 'F') : 'Not scored';
    const currentWords = documentText.trim().split(/\s+/u).length;
    const bounds = suppliedRubric?.requiredWordCount;
    feedback.wordCountAnalysis = {
      currentWords,
      targetWords: bounds?.target || 0,
      status: bounds?.min > 0 && currentWords < bounds.min ? 'too_short' : bounds?.max > 0 && currentWords > bounds.max ? 'too_long' : 'within_range',
      recommendation: bounds?.min > 0 || bounds?.max > 0
        ? 'Count includes all submitted text, including headings and references. Check the instructor’s counting rules.'
        : 'No word count bounds supplied; no length requirement was assessed.',
    };
    const knownTitles = new Set((selectedArticles || []).map((a: any) => String(a.title || '').trim().toLowerCase()));
    feedback.citationChecks = (feedback.citationChecks || []).map((check: any) => ({
      ...check,
      paperFound: Boolean(check.paperFound && check.paperTitle && knownTitles.has(check.paperTitle.trim().toLowerCase())),
      notes: `${check.notes || ''} Full-text claim support has not been independently verified.`,
    }));
    return res.json({ feedback });
  } catch (error: any) {
    console.error('Error in /api/proofread/review:', error);
    sendAiError(res, error, requestedModel);
  }
});

// 6. Inline Writing Assistant (Academic Enhancements)
app.post('/api/editor/assist', async (req, res) => {
  const requestedModel = req.get('X-AI-Model') || 'gemini-3.5-flash-lite';
  try {
    const { action, selectedText, fullDocument, citationStyle, references, rubric } = req.body;

    let prompt = '';
    const refsList = (references || [])
      .map((r: any) => `"${r.title}" by ${(r.authors || []).map((a: any) => a.name).join(', ')} (${r.year || 'n.d.'})`)
      .join('\n');

    switch (action) {
      case 'improve-academic-tone':
        prompt = `Rewrite the following academic text to enhance precision, formal academic vocabulary, objective tone, and analytical clarity while preserving the original thesis:\n\n"${selectedText}"`;
        break;
      case 'expand-argument':
        prompt = `Expand upon this academic argument with deeper critical reasoning, theoretical context, and academic synthesis. Available references to cite if relevant:\n${refsList}\n\nArgument snippet:\n"${selectedText}"`;
        break;
      case 'counter-argument':
        prompt = `Generate a rigorous counter-argument or critical nuance to the following claim, followed by an effective academic rebuttal supported by scholarly evidence:\n\nClaim:\n"${selectedText}"`;
        break;
      case 'synthesize-citations':
        prompt = `Synthesize the following points into an integrated paragraph featuring standard ${citationStyle || 'APA 7'} citations for the available references:\nReferences available:\n${refsList}\n\nPoints:\n"${selectedText}"`;
        break;
      default:
        prompt = `Improve the clarity and academic strength of this paragraph:\n\n"${selectedText}"`;
    }

    prompt += `\n\nUse the following surrounding document only for context: ${(fullDocument || '').slice(0, 4000)}\nReturn ONLY one revised passage, ready to replace the selection. Do not include alternatives, explanations, headings, or a list of changes. Preserve the student's claims; do not invent citations or sources.`;

    const response = await generateContentWithRetry({
      model: requestedModel,
      contents: prompt + academicContext(rubric, references),
    });

    return res.json({ result: response.text || '' } satisfies EditorAssistResponse);
  } catch (error: any) {
    console.error('Error in /api/editor/assist:', error);
    sendAiError(res, error, requestedModel);
  }
});

// Extract actual document text rather than converting a paper into assignment criteria.
app.post('/api/document/extract-text', async (req, res) => {
  try {
    const { imageBase64, imageMimeType, pdfBase64 } = req.body;
    const encoded = pdfBase64 || imageBase64;
    if (typeof encoded !== 'string' || !encoded) return res.status(400).json({ error: 'A PDF or image is required.' });
    const mimeType = pdfBase64 ? 'application/pdf' : imageMimeType;
    if (!['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(mimeType)) {
      return res.status(400).json({ error: 'Use a PDF, PNG, JPEG, or WebP document.' });
    }
    const response = await generateContentWithRetry({
      model: req.get('X-AI-Model') || 'gemini-3.5-flash-lite',
      contents: [{ role: 'user', parts: [
        { text: 'Transcribe all readable document text in reading order, preserving paragraphs, headings, and references. Do not summarize, evaluate, or invent missing text. Return only the document transcription.' },
        { inlineData: { mimeType, data: encoded.includes(',') ? encoded.slice(encoded.indexOf(',') + 1) : encoded } },
      ] }],
    });
    const text = response.text?.trim();
    if (!text) return res.status(422).json({ error: 'No readable text was found in the document.' });
    return res.json({ text } satisfies DocumentTextResponse);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Could not extract document text.' });
  }
});

// 7. Document Import & Source Identification with AI Analysis & Rubric Alignment
app.post('/api/document/analyze-import', async (req, res) => {
  try {
    const { documentText, rubric, studentDirection } = req.body;

    if (!documentText || documentText.trim().length < 15) {
      return res.status(400).json({ error: 'Document text is too short for analysis.' });
    }

    const hasRubric = !!(rubric && rubric.criteria && rubric.criteria.length > 0);

    const prompt = `You are an expert academic evaluator, literature indexer, and research director.
Analyze the following student document text.

Student Document:
"""
${documentText}
"""

${
  hasRubric
    ? `Rubric & Assignment Criteria Provided:
- Title: ${rubric.title || 'Assignment'}
- Target Word Count: ${rubric.requiredWordCount?.target || 'Not specified'} (Range: ${rubric.requiredWordCount?.min || 0} - ${rubric.requiredWordCount?.max || 0})
- Citation Style: ${rubric.requiredCitationStyle || 'APA7'}
- Required Sources: ${rubric.requiredSourceCount || 4}
- Criteria Breakdown:
${(rubric.criteria || []).map((c: any) => `- [${c.id}] ${c.category} (${c.weight}%): ${c.description}. Guidelines: ${(c.guidelines || []).join(', ')}`).join('\n')}
- Key Questions: ${(rubric.keyQuestionsToAnswer || []).join('; ')}`
    : `Note: NO SPECIFIC RUBRIC OR DIRECTIONS WERE PROVIDED BY THE USER.
Perform an objective evaluation based on universal university scholarly writing standards (clarity of thesis, depth of scholarly evidence, structure, academic tone, citation integrity). Explicitly note the absence of a rubric.`
}

Tasks:
1. Extract Title & Title Page Fields: Infer or extract the main paper title, and check the title page / header / introductory lines for:
   - paperTitle: The exact or inferred paper title.
   - authorName: Author or student researcher name.
   - courseName: Course code or name (e.g. "PSYC 4020: Advanced Developmental Cognitive Neuroscience").
   - institution: Academic department or university affiliation (e.g. "Department of Psychology, University of California").
   - instructorName: Instructor or professor name (e.g. "Prof. Eleanor Vance, Ph.D.").
   - dueDate: Date or semester mentioned.
2. Identify All Sources & In-Text Citations Used: Scan the text for every cited paper, author name, parenthetical or narrative citation (e.g. "Smith et al. (2022)", "(Johnson, 2021)"), or bibliography entries at the end. For each, extract the paper title (or infer topic/title), author names, year, venue, occurrence count, and raw citation.
3. ${
  hasRubric
    ? `Rubric Alignment: Grade how well the document fulfills each rubric criterion ('strong', 'moderate', 'weak', or 'missing') with evidence snippets and recommendations.`
    : `General Academic Alignment: Evaluate standard academic dimensions (Thesis, Evidence, Critical Nuance, Style).`
}
4. Overall Evaluation: Executive summary, key strengths, critical gaps, immediate actionable recommendations, and estimated grade band.`;

    const response = await generateContentWithRetry({
      model: req.get('X-AI-Model') || 'gemini-3.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedTitle: { type: Type.STRING },
            titlePageMetadata: {
              type: Type.OBJECT,
              properties: {
                paperTitle: { type: Type.STRING },
                authorName: { type: Type.STRING },
                courseName: { type: Type.STRING },
                institution: { type: Type.STRING },
                instructorName: { type: Type.STRING },
                dueDate: { type: Type.STRING },
              },
            },
            wordCount: { type: Type.INTEGER },
            identifiedSources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  paperTitle: { type: Type.STRING },
                  authors: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  year: { type: Type.INTEGER },
                  inTextOccurrences: { type: Type.INTEGER },
                  rawCitation: { type: Type.STRING },
                  venue: { type: Type.STRING },
                },
                required: ['paperTitle', 'authors', 'rawCitation'],
              },
            },
            rubricFound: { type: Type.BOOLEAN },
            rubricAlignment: {
              type: Type.OBJECT,
              properties: {
                alignmentScore: { type: Type.INTEGER, description: 'Percentage 0-100' },
                matchedCriteria: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      criterionTitle: { type: Type.STRING },
                      status: { type: Type.STRING, description: 'strong, moderate, weak, or missing' },
                      evidenceSnippet: { type: Type.STRING },
                      recommendation: { type: Type.STRING },
                    },
                    required: ['criterionTitle', 'status', 'evidenceSnippet', 'recommendation'],
                  },
                },
              },
              required: ['alignmentScore', 'matchedCriteria'],
            },
            overallEvaluation: {
              type: Type.OBJECT,
              properties: {
                executiveSummary: { type: Type.STRING },
                strengths: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                criticalGaps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                immediateActionItems: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                estimatedGradeBand: { type: Type.STRING },
              },
              required: ['executiveSummary', 'strengths', 'criticalGaps', 'immediateActionItems'],
            },
          },
          required: ['identifiedSources', 'rubricFound', 'overallEvaluation'],
        },
      },
    });

    const parsedData = JSON.parse(response.text || '{}');

    // Also convert identified sources into ScholarlyPaper format for direct reference pool import
    const extractedPapers = (parsedData.identifiedSources || []).map((s: any, idx: number) => ({
      paperId: `imported-${Date.now()}-${idx + 1}`,
      title: s.paperTitle || `Cited Reference (${(s.authors || []).join(', ')}, ${s.year || 'n.d.'})`,
      authors: (s.authors || ['Anonymous']).map((name: string) => ({ name })),
      year: s.year || new Date().getFullYear(),
      abstract: `Source identified from imported document: "${s.rawCitation}" (Cited ${s.inTextOccurrences || 1} time(s)).`,
      venue: s.venue || 'Academic Reference',
      selected: true,
    }));

    return res.json({
      analysis: {
        ...parsedData,
        rubricFound: hasRubric,
      },
      extractedPapers,
    });
  } catch (error: any) {
    console.error('Error in /api/document/analyze-import:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze imported document' });
  }
});


// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Academic Research Studio Server running on http://localhost:${PORT}`);
  });
}

startServer();
