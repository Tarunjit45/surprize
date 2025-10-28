// netlify/functions/generate.js
const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

exports.handler = async function(event) {
  // Only accept POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { secret, kind, targetName, senderName } = body;

    // Check a secret code to make page private (optional)
    const REQUIRED_SECRET = process.env.SITE_SECRET || ""; // set in Netlify settings
    if (REQUIRED_SECRET && secret !== REQUIRED_SECRET) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid secret code." }) };
    }

    // Validate API key is present in environment
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: "Server not configured (missing GEMINI_API_KEY)." }) };
    }

    // Build a friendly prompt
    let prompt;
    if (kind === 'compliment') {
      prompt = `Write a short, sweet compliment message for ${targetName}. Keep it romantic but tasteful. Signed: ${senderName}.`;
    } else {
      // poem
      prompt = `Write a short romantic poem dedicated to ${targetName}. Make it sweet, poetic, and original. At the end add one-line sign off: "From ${senderName}".`;
    }

    // Gemini REST endpoint (use model that your API key supports; gemini-2.5-flash is common)
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      // you can tune other params here
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_KEY
      },
      body: JSON.stringify(payload),
    });

    const json = await resp.json();
    if (!resp.ok) {
      return { statusCode: resp.status, body: JSON.stringify({ error: json || "Gemini API error" }) };
    }

    // Try to safely extract text from response shape
    let message = "";
    if (json?.candidates && Array.isArray(json.candidates) && json.candidates.length > 0) {
      message = json.candidates.map(c => c.content?.[0]?.text || c.text || "").join("\n\n");
    } else if (json?.output && json.output[0] && json.output[0].content) {
      // fallback structure
      message = json.output.map(o => (o.content || []).map(c => c.parts?.map(p=>p.text).join("") ).join("")).join("\n\n");
    } else if (json?.generatedText) {
      message = json.generatedText;
    } else {
      // last fallback
      message = JSON.stringify(json).slice(0, 2000);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message })
    };

  } catch (err) {
    console.error("Function error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal server error." }) };
  }
};
