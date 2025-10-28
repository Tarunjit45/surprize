// api/generate.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { kind = "poem", targetName = "Shrabani", senderName = "Tarunjit" } = req.body || {};

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

    if (!GEMINI_KEY) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY in environment variables." });
    }

    // 🔮 Bengali prompt creation
    let promptBase = "";
    if (kind === "shayari") {
      promptBase = `একটি রোমান্টিক বাংলা শায়ারি লেখো ${targetName}-এর জন্য, যা আবেগপূর্ণ এবং একদম ইউনিক হবে। শেষ লাইনে লিখো — "From ${senderName}".`;
    } else if (kind === "message") {
      promptBase = `${targetName}-এর জন্য একটি ভালোবাসায় ভরা বাংলা মেসেজ লেখো। এটি আন্তরিক ও হৃদয়স্পর্শী হোক। সাইন করো — ${senderName}.`;
    } else {
      promptBase = `একটি সুন্দর রোমান্টিক বাংলা কবিতা লেখো ${targetName}-এর জন্য। এটি স্বপ্নময় ও মিষ্টি হোক। শেষ লাইনে লিখো — "From ${senderName}".`;
    }

    // 🔗 Gemini API endpoint (v1beta)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

    const payload = {
      contents: [
        { role: "user", parts: [{ text: promptBase }] }
      ],
      temperature: 0.8,
      maxOutputTokens: 512
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_KEY
      },
      body: JSON.stringify(payload)
    });

    const json = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", json);
      return res.status(response.status).json({ error: json });
    }

    // ✨ Extract message text properly
    let message = "";
    if (json?.candidates && json.candidates.length > 0) {
      message = json.candidates
        .map(c => {
          if (c?.content?.parts) {
            return c.content.parts.map(p => p.text || "").join("");
          }
          if (c?.content && Array.isArray(c.content)) {
            return c.content
              .map(p => (p.parts || []).map(t => t.text).join(""))
              .join("");
          }
          return "";
        })
        .join("\n\n");
    } else {
      message = json?.text || "No response received.";
    }

    return res.status(200).json({ message });
  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}
