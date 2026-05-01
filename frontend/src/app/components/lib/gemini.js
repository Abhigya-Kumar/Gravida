// ── Shared Gemini API helper ──────────────────────────────────────────────────
// Calls the Gemini REST API directly via fetch — works in any browser.
// API key must be set as VITE_GEMINI_API_KEY in frontend/.env
// The dev server must be RESTARTED (not just hot-reloaded) after editing .env

// Models to try in order — if the first is rate-limited, the next is used
const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
];

/**
 * Send a single text prompt to Gemini and return the raw text reply.
 * Automatically falls back through available models if one returns 429.
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export async function geminiGenerate(prompt) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  console.log('[Gemini] API key present:', !!apiKey, '| key length:', apiKey?.length ?? 0);

  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      'VITE_GEMINI_API_KEY is missing. ' +
      'Add it to frontend/.env as VITE_GEMINI_API_KEY=your_key_here ' +
      'and RESTART the dev server (Ctrl+C then npm run dev).'
    );
  }

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1500,
    },
  };

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
    console.log(`[Gemini] Trying model: ${model} ...`);

    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (networkErr) {
      lastError = new Error(`Network error reaching Gemini API: ${networkErr.message}`);
      continue; // try next model
    }

    // If rate-limited, try next model
    if (res.status === 429) {
      console.warn(`[Gemini] Model ${model} rate-limited (429), trying next...`);
      lastError = new Error(`Model ${model} quota exceeded (429).`);
      continue;
    }

    if (!res.ok) {
      let errBody = '';
      try { errBody = await res.text(); } catch { /* ignore */ }
      console.error(`[Gemini] ${model} HTTP error:`, res.status, errBody);

      if (res.status === 400) {
        lastError = new Error(`Bad request (400): ${errBody.substring(0, 200)}`);
        continue;
      }
      if (res.status === 403) {
        throw new Error('API key not authorised (403). Check your key is correct and enabled at aistudio.google.com.');
      }
      if (res.status === 404) {
        console.warn(`[Gemini] Model ${model} not found (404), trying next...`);
        lastError = new Error(`Model ${model} not available.`);
        continue;
      }
      lastError = new Error(`Gemini API returned ${res.status}: ${errBody.substring(0, 200)}`);
      continue;
    }

    // Success!
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error(`[Gemini] ${model} empty response:`, JSON.stringify(data).substring(0, 300));
      lastError = new Error('Gemini returned an empty response.');
      continue;
    }

    console.log(`[Gemini] ✓ ${model} responded, length: ${text.length}`);
    return text;
  }

  // All models failed
  throw lastError || new Error('All Gemini models failed. Please try again later.');
}

/**
 * Parse a Gemini response that should contain JSON,
 * stripping any markdown code fences the model might add.
 * @param {string} text
 * @returns {any}
 */
export function parseGeminiJSON(text) {
  const clean = text
    .replace(/^```json\s*/im, '')
    .replace(/^```\s*/im, '')
    .replace(/```\s*$/g, '')
    .trim();

  try {
    return JSON.parse(clean);
  } catch (e) {
    console.error('[Gemini] JSON parse failed. Raw text:', clean.substring(0, 500));
    throw new Error(`Could not parse Gemini response as JSON: ${e.message}`);
  }
}
