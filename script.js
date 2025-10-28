/* script.js
   - Handles button clicks, API calls, animations & fallbacks
*/

const buttons = document.querySelectorAll('.btn');
const resultWrap = document.getElementById('resultWrap');
const typewriterEl = document.getElementById('typewriter');
const anotherBtn = document.getElementById('another');
const saveBtn = document.getElementById('save');

// 🌈 Heart particle animation
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let particles = [];
function resizeCanvas() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = canvas.height + Math.random() * 200;
    this.vx = (Math.random() - 0.5) * 0.6;
    this.vy = -1.5 - Math.random() * 1.5;
    this.size = 8 + Math.random() * 12;
    this.alpha = 0.6 + Math.random() * 0.4;
    this.color = `rgba(239,71,125,${this.alpha})`;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 0.002;
    if (this.y < -40 || this.alpha <= 0) this.reset();
  }
  draw() {
    ctx.beginPath();
    let s = this.size;
    ctx.moveTo(this.x, this.y);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x - s / 4, this.y, s / 2, 0, Math.PI * 2);
    ctx.arc(this.x + s / 4, this.y, s / 2, 0, Math.PI * 2);
    ctx.moveTo(this.x - s / 1.1, this.y);
    ctx.bezierCurveTo(this.x, this.y + s, this.x, this.y + s, this.x + s / 1.1, this.y);
    ctx.fill();
  }
}

for (let i = 0; i < 60; i++) particles.push(new Particle());
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach((p) => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(loop);
}
loop();

// ✍️ Typewriter animation
async function revealText(text) {
  resultWrap.classList.remove('hidden');
  typewriterEl.textContent = '';
  const chars = Array.from(text);
  for (let i = 0; i < chars.length; i++) {
    typewriterEl.textContent += chars[i];
    await new Promise((r) => setTimeout(r, 12 + Math.random() * 18));
  }
  confetti({
    particleCount: 50,
    spread: 80,
    origin: { y: 0.3 },
  });
}

// 💬 Fetch message from backend
async function fetchMessage(kind) {
  buttons.forEach((b) => (b.disabled = true));
  typewriterEl.textContent = 'Thinking of the perfect words... 💭';
  resultWrap.classList.remove('hidden');

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: kind, targetName: "Shrabani Dev", senderName: "Tarunjit" }),
    });

    const json = await res.json();
    if (!res.ok || !json.message) throw new Error("Server error");

    await revealText(json.message);
  } catch (err) {
    console.warn("Fallback triggered:", err.message);

    // ✨ Local fallback romantic coder messages
    const localFallbacks = {
      shayari: [
        `💻 কোডের মতোই তোমায় ভালোবাসা,\nSyntax error নেই, কেবল নিখুঁত ভাষা।\nif (heart == yours) return "Forever"; ❤️`,
        `🧠 আমার কোডে যত if-else আছে, সবই ${"Shrabani"}-এর জন্য truth return করে। 💘`,
        `⚙️ ${"Shrabani"}, তুমি আমার কোডের perfect algorithm — run করলে পুরো life optimize হয়ে যায়! 😍`,
      ],
      message: [
        `👩‍💻 ${"Shrabani"}, তুমি আমার কোডের সেই missing semicolon — তোমায় ছাড়া সব incomplete লাগে। ❤️`,
        `⌨️ ভালোবাসা যদি function হত, আমি লিখতাম — love(${"Shrabani"}); 💓`,
        `🖥️ তোমার হাসিটা যেন console.log("happiness"); — একবার দেখলেই পুরো সিস্টেম fresh হয়ে যায়! 💕`,
      ],
      poem: [
        `🧠 সফটওয়্যারের মতোই তুমি, ${"Shrabani"} — তোমার হাসিতে আমি crash হয়ে যাই,\nতোমার চোখ debug করতে করতে আমার পুরো logic হারিয়ে যায়। 💖`,
        `🌙 তোমার চোখে তারার আলো, তোমার কণ্ঠে bug-free কোডের ভালোবাসা,\nআমি compile করি তোমার নাম প্রতিদিন নতুন version-এ। 💞`,
        `⚡ তোমার presence মানে high-speed WiFi,\nতুমি ছাড়া মানে “Server Not Found”! 💻❤️`,
      ],
    };

    const randoms = localFallbacks[kind] || ["💔 সার্ভার ঘুমাচ্ছে, কিন্তু ভালোবাসা জেগে আছে তোমার জন্য।"];
    const message = randoms[Math.floor(Math.random() * randoms.length)];

    await revealText(`🧠 AI offline... but here’s a line straight from a coder’s heart ❤️\n\n${message}`);
  } finally {
    buttons.forEach((b) => (b.disabled = false));
  }
}

// 🪄 Button events
buttons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const kind = btn.getAttribute('data-kind');
    fetchMessage(kind);
  });
});

anotherBtn.addEventListener('click', () => fetchMessage('message'));

saveBtn.addEventListener('click', () => {
  const text = typewriterEl.textContent;
  if (!text) return;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'for_shrabani.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

