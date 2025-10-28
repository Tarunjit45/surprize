const popup = document.getElementById("popup");
const resultText = document.getElementById("resultText");

async function generate(type) {
  resultText.textContent = "✨ Generating just for you...";
  popup.classList.remove("hidden");

  let prompt = "";
  if (type === "shayari")
    prompt = "Write a short romantic Bengali shayari for a girl named Shrabani Dev. Make it poetic and emotional.";
  else if (type === "poem")
    prompt = "Write a romantic Bengali poem for a girl named Shrabani Dev. It should sound dreamy and full of love.";
  else
    prompt = "Write a cute Bengali love message for a girl named Shrabani Dev. It should be short and heartfelt.";

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyChuIVNhKHVWJBwlE_obn-X_uaIlaUgW0w",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    const data = await response.json();
    resultText.textContent =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "কিছু ভুল হয়েছে 💔 আবার চেষ্টা করো!";
  } catch (err) {
    resultText.textContent = "Network error 😢 Please try again later.";
  }
}

function closePopup() {
  popup.classList.add("hidden");
}
