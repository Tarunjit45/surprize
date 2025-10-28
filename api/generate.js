// api/generate.js — for Vercel
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { kind = "poem", targetName = "Shrabani", senderName = "Tarunjit" } = req.body;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

    // 🪄 Build prompt dynamically in Bengali
    let promptBase = "";
    if (kind === "shayari") {
      promptBase = `একটি রোমান্টিক বাংলা শায়ারি লেখো ${targetName}-এর জন্য, যা আবেগপূর্ণ এবং একদম ইউনিক হবে। শেষ লাইনে লিখো — "From ${senderName}".`;
    } else if (kind === "message") {
      promptBase = `${targetName}-এর জন্য একটি ভালোবাসায় ভরা বাংলা মেসেজ লেখো। এটি আন্তরিক ও হৃদয়স্পর্শী হোক। সাইন করো — ${senderName}.`;
    } else {
      promptBase = `একটি সুন্দর রোমান্টিক বাংলা কবিতা লেখো ${targetName}-এর জন্য। এটি স্বপ্নময় ও মিষ্টি হোক। শেষ লাইনে লিখো — "From ${senderName}".`;
    }

    // 🌐 Call Gemini API
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

    const payload = {
      contents: [{ role: "user", parts: [{ text: promptBase }] }],
      temperature: 0.8,
      maxOutputTokens: 512,
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      console.error("Gemini API error:", resp.status);
      throw new Error("Gemini API failed");
    }

    const json = await resp.json();

    let message = "";
    if (json?.candidates?.length) {
      message =
        json.candidates[0]?.content?.parts?.[0]?.text ||
        json.candidates[0]?.output_text ||
        "💔";
    }

    if (!message || message === "💔") throw new Error("Empty message");

    return res.status(200).json({ message });
  } catch (err) {
    console.error("⚠️ Fallback mode activated:", err.message);

    const { kind, targetName, senderName } = req.body;

    // 💖 Multiple fallback options
    const fallbackData = {
      shayari: [
        `💻 কোডের মতোই তোমায় ভালোবাসা,\nSyntax error নেই, কেবল নিখুঁত ভাষা।\nIf (heart == yours) {\n   return "Forever";\n}\nFrom ${senderName} ❤️`,
        `🧠 আমার কোডে যত if-else আছে, সবই ${targetName}-এর জন্য truth return করে। 💘\n— From ${senderName}`,
        `⚙️ ${targetName}, তুমি আমার কোডের সেই perfect algorithm,\nযা execute হলে আমার পুরো world optimize হয়ে যায়। 😍\n— From ${senderName}`,
        `💾 যতই ডিবাগ করি, একটাই error পাই —\n“Missing ${targetName} in my life.” 💔\n— From ${senderName}`,
      ],
      message: [
        `👩‍💻 ${targetName}, তুমি আমার কোডের সেই missing semicolon,\nযাকে ছাড়া সব কিছু incomplete লাগে।\nতোমায় পেলে পুরো কোডটাই চলে perfect run-এ। ❤️\n— ${senderName}`,
        `🖥️ ${targetName}, তুমি আমার CPU-এর সেই core,\nযা ছাড়া কোনো process complete হয় না। 💓\n— ${senderName}`,
        `⌨️ ভালোবাসা যদি একটা function হত, তাহলে আমি লিখতাম — love(${targetName}); ❤️\n— ${senderName}`,
        `🧡 তোমার হাসিটা যেন console.log("happiness"); — একবার দেখলেই পুরো সিস্টেম fresh হয়ে যায়!\n— ${senderName}`,
      ],
      poem: [
        `🧠 সফটওয়্যারের মতোই তুমি, ${targetName} —\nতোমার হাসিতে আমি crash হয়ে যাই।\nতোমার চোখ দুটো debug করতে করতে,\nআমার পুরো logic lost হয়ে যায়!\n— From ${senderName} 💖`,
        `💻 আমি কোড লিখি রাত জেগে,\nতবু তোমার নামটাই আসে প্রতিটি loop-এ।\nতুমি আমার dream function,\nreturn love(${senderName}) ❤️\n— ${senderName}`,
        `🌙 তোমার চোখে তারার আলো,\nতোমার কণ্ঠে মিষ্টি bug-free কোডের ভালোবাসা।\nআমি compile করি তোমার নাম, ${targetName}, প্রতিদিন নতুন version-এ। 💕\n— From ${senderName}`,
        `⚡ তোমার presence মানে high-speed network,\nতোমার অনুপস্থিতি মানে server down।\nতুমি ছাড়া সব error, শুধু তুমি fix করো আমার life। 💻❤️\n— From ${senderName}`,
      ],
    };

    // 🎲 Pick a random fallback message
    const responses = fallbackData[kind] || ["💔 সার্ভার ঘুমাচ্ছে, কিন্তু আমার ভালোবাসা জেগে আছে তোমার জন্য। — From Dev ❤️"];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return res.status(200).json({ message: randomResponse });
  }
}
