// netlify/functions/generate.js
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  try {
    const body = JSON.parse(event.body || '{}');
    const { kind = 'poem', targetName = 'Shrabani', senderName = 'Tarunjit' } = body;

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (!GEMINI_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured (missing GEMINI_API_KEY).' }) };
    }

    // Compose prompt: ensure reply is in Bengali (Bangla script)
    let promptBase = '';
    if (kind === 'shayari') {
      promptBase = `Write a short romantic Bengali shayari (in Bangla script) dedicated to ${targetName}. Keep it poetic, emotional, and original. End with a one-line signoff: "From ${senderName}".`;
    } else if (kind === 'message') {
      promptBase = `Write a short heartfelt Bengali love message (in Bangla script) to ${targetName}. Keep it warm and sincere. Signed: ${senderName}.`;
    } else {
      // poem
      promptBase = `Write a romantic Bengali poem (in Bangla script) for ${targetName}. Make it dreamy and expressive. Sign off with "From ${senderName}".`;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

    const payload = {
      // contents: a list of messages / user input
      contents: [
        { role: "user", parts: [{ text: promptBase }] }
      ],
      temperature: 0.8,
      maxOutputTokens: 512
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_KEY
      },
      body: JSON.stringify(payload)
    });

    const json = await resp.json();
    if (!resp.ok) {
      console.error('Gemini error:', JSON.stringify(json));
      return { statusCode: resp.status, body: JSON.stringify({ error: json }) };
    }

    // Extract text robustly from API response
    let message = "";
    if (json?.candidates && json.candidates.length) {
      message = json.candidates.map(c => {
        if (c?.content && c.content.length) {
          return c.content.map(p => p.parts?.map(t => t.text).join('')).join('');
        }
        if (c.text) return c.text;
        return '';
      }).join("\n\n");
    } else if (json?.output && Array.isArray(json.output)) {
      message = json.output.map(o => (o.content || []).map(c => (c.parts || []).map(p => p.text).join('')).join('')).join('\n\n');
    } else if (json?.generatedText) {
      message = json.generatedText;
    } else {
      message = JSON.stringify(json).slice(0, 2000);
    }

    return { statusCode: 200, body: JSON.stringify({ message }) };
  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error.' }) };
  }
};
